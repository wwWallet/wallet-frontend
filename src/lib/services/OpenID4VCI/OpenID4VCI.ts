import { IOpenID4VCI } from '../../interfaces/IOpenID4VCI';
import { OpenID4VCIClientState } from '../../types/OpenID4VCIClientState';
import { CredentialOfferSchema } from '../../schemas/CredentialOfferSchema';
import { StorableCredential } from '../../types/StorableCredential';
import * as jose from 'jose';
import { generateRandomIdentifier } from '../../utils/generateRandomIdentifier';
import * as config from '../../../config';
import { useHttpProxy } from '../HttpProxy/HttpProxy';
import { useOpenID4VCIClientStateRepository } from '../OpenID4VCIClientStateRepository';
import { useCallback, useContext, useMemo, useEffect, useRef } from 'react';
import SessionContext from '@/context/SessionContext';
import CredentialsContext from '@/context/CredentialsContext';
import { useOpenID4VCIPushedAuthorizationRequest } from './OpenID4VCIAuthorizationRequest/OpenID4VCIPushedAuthorizationRequest';
import { useOpenID4VCIAuthorizationRequestForFirstPartyApplications } from './OpenID4VCIAuthorizationRequest/OpenID4VCIAuthorizationRequestForFirstPartyApplications';
import { useOpenID4VCIHelper } from '../OpenID4VCIHelper';
import { GrantType, TokenRequestError, useTokenRequest } from './TokenRequest';
import { useCredentialRequest } from './CredentialRequest';
import type { CredentialConfigurationSupported, OpenidCredentialIssuerMetadata, OpenidCredentialIssuerMetadataSchema } from 'wallet-common';
import { useTranslation } from 'react-i18next';


const redirectUri = config.OPENID4VCI_REDIRECT_URI as string;
const openid4vciProofTypePrecedence = config.OPENID4VCI_PROOF_TYPE_PRECEDENCE.split(',') as string[];

export function useOpenID4VCI({ errorCallback, showPopupConsent, showMessagePopup }: { errorCallback: (title: string, message: string) => void, showPopupConsent: (options: Record<string, unknown>) => Promise<boolean>, showMessagePopup: (message: { title: string, description: string }) => void }): IOpenID4VCI {

	const httpProxy = useHttpProxy();
	const openID4VCIClientStateRepository = useOpenID4VCIClientStateRepository();
	const { api } = useContext(SessionContext);
	const { getData, credentialEngine } = useContext<any>(CredentialsContext);

	const { t } = useTranslation();

	const { post } = api;
	const openID4VCIHelper = useOpenID4VCIHelper();

	const openID4VCIPushedAuthorizationRequest = useOpenID4VCIPushedAuthorizationRequest();
	const openID4VCIAuthorizationRequestForFirstPartyApplications = useOpenID4VCIAuthorizationRequestForFirstPartyApplications();

	const tokenRequestBuilder = useTokenRequest();
	const credentialRequestBuilder = useCredentialRequest();

	const credentialRequest = useCallback(
		async (response: any, flowState: OpenID4VCIClientState) => {
			console.log('credentialRequest')
			const {
				data: { access_token },
			} = response;

			const { sdJwtVerifier } = credentialEngine

			const [credentialIssuerMetadata] = await Promise.all([
				openID4VCIHelper.getCredentialIssuerMetadata(flowState.credentialIssuerIdentifier)
			]);

			if (credentialIssuerMetadata.metadata.nonce_endpoint) {
				const nonceEndpointResp = await httpProxy.post(credentialIssuerMetadata.metadata.nonce_endpoint, {});
				const { c_nonce } = nonceEndpointResp.data as { c_nonce: string };
				credentialRequestBuilder.setCNonce(c_nonce);
			}

			credentialRequestBuilder.setCredentialEndpoint(credentialIssuerMetadata.metadata.credential_endpoint);
			credentialRequestBuilder.setAccessToken(access_token);
			credentialRequestBuilder.setCredentialIssuerIdentifier(flowState.credentialIssuerIdentifier);

			if (flowState?.dpop) {
				const privateKey = await jose.importJWK(flowState?.dpop.dpopPrivateKeyJwk, flowState?.dpop.dpopAlg)
				credentialRequestBuilder.setDpopPrivateKey(privateKey as jose.KeyLike);
				credentialRequestBuilder.setDpopPublicKeyJwk(flowState.dpop.dpopPublicKeyJwk);
				credentialRequestBuilder.setDpopJti(flowState.dpop.dpopJti);
				credentialRequestBuilder.setDpopNonce(response.headers['dpop-nonce']);
				await credentialRequestBuilder.setDpopHeader();
			}

			const [_credConfId, credConf] = Object.entries(credentialIssuerMetadata.metadata.credential_configurations_supported).filter(([id, _credConf]) =>
				id === flowState.credentialConfigurationId
			)[0];

			let selectedProofType: 'attestation' | 'jwt' = 'jwt'; // default
			for (const proof_type of openid4vciProofTypePrecedence) {
				if (proof_type === 'attestation' && credConf?.proof_types_supported?.attestation) {
					selectedProofType = 'attestation';
					break;
				}
				else if (proof_type === 'jwt' && credConf?.proof_types_supported?.jwt) {
					selectedProofType = 'jwt';
					break;
				}
			}

			console.log("Selected proof type = ", selectedProofType);

			const { credentialResponse } = await credentialRequestBuilder.execute(flowState.credentialConfigurationId, selectedProofType);

			console.log("Response = ", credentialResponse)
			const credentialArray = credentialResponse.data.credentials.map(c => c.credential);

			const new_c_nonce = credentialResponse.data.c_nonce;
			const new_c_nonce_expires_in = credentialResponse.data.c_nonce_expires_in;

			if (new_c_nonce && new_c_nonce_expires_in) {
				flowState.tokenResponse.data.c_nonce = new_c_nonce;
				flowState.tokenResponse.data.c_nonce_expiration_timestamp = Math.floor(Date.now() / 1000) + new_c_nonce_expires_in;
				await openID4VCIClientStateRepository.updateState(flowState);
			}

			await openID4VCIClientStateRepository.cleanupExpired();

			const identifier = generateRandomIdentifier(32);

			const verifiedCredentials = (await Promise.all(credentialArray.map(async rawCredential => {
				try {
					const result = await sdJwtVerifier.verify({ rawCredential, opts: { verifySchema: true } });
					console.log('credential validation', result);

					if (result.success) {
						return rawCredential
					} else if (result.error == 'VctSchemaNotFound') {
						return rawCredential
					}
				} catch (err) {
					console.log('credential validation error', err);
				}
			}))).filter(credential => credential);

			const storableCredentials: StorableCredential[] = verifiedCredentials.map((credential, index) => ({
				credentialIdentifier: identifier,
				credential: credential,
				format: credentialIssuerMetadata.metadata.credential_configurations_supported[flowState.credentialConfigurationId].format,
				credentialConfigurationId: flowState.credentialConfigurationId,
				credentialIssuerIdentifier: credentialIssuerMetadata.metadata.credential_issuer,
				sigCount: 0,
				instanceId: index,
			}));

			let warnings = [];

			const uniqueStorableCredentials = storableCredentials.filter(
				(cred) => cred.instanceId === 0
			);

			for (const storableCredential of uniqueStorableCredentials) {
				const rawCredential = storableCredential.credential;
				const result = await credentialEngine.credentialParsingEngine.parse({ rawCredential })
				console.log('result', result);
				if (result.success) {
					console.log(`Credential parsed successfully:`, result.value);

					if (result.value.warnings && result.value.warnings.length > 0) {
						console.warn(`Credential had warnings:`, result.value.warnings);
						warnings = result.value.warnings;
					}
				} else {
					console.error(`Credential failed to parse:`, result.error, result.message);
					showMessagePopup({ title: t('issuance.error'), description: t(`parsing.error${result.error}`) });
					return;
				}
			}

			let userConsent = true;
			if (warnings.length > 0 && config.VITE_DISPLAY_ISSUANCE_WARNINGS === true) {
				userConsent = await showPopupConsent({
					title: t("issuance.title"),
					warnings: warnings
				});
			}

			if (userConsent) {
				credentialStore(storableCredentials);
			}

			return;

		},
		[openID4VCIHelper, post, openID4VCIClientStateRepository, credentialRequestBuilder, getData]
	);

	const credentialStore = useCallback(
		async (credentialsToStore: StorableCredential[]) => {
			await post('/storage/vc', {
				credentials: credentialsToStore
			});

			getData(true);
		}, []
	);

	const requestCredentials = useCallback(
		async (credentialIssuerIdentifier: string, requestCredentialsParams: {
			dpopNonceHeader?: string,
			preAuthorizedCodeGrant?: {
				pre_authorized_code: string;
			},
			authorizationCodeGrant?: {
				state: string;
				authorizationResponseUrl: string;
				code: string;
			},
			usingActiveAccessToken?: {
				credentialConfigurationId: string;
			},
			refreshTokenGrant?: {
				credentialConfigurationId: string;
			}
		}) => {
			console.log('requestCredentials')
			console.log(JSON.stringify(requestCredentialsParams));
			const [authzServerMetadata, clientId] = await Promise.all([
				openID4VCIHelper.getAuthorizationServerMetadata(credentialIssuerIdentifier),
				openID4VCIHelper.getClientId(credentialIssuerIdentifier)
			]);
			if (requestCredentialsParams.usingActiveAccessToken) {
				console.log("Attempting with active access token")

				const flowState = await openID4VCIClientStateRepository.getByCredentialIssuerIdentifierAndCredentialConfigurationIdAndUserHandle(credentialIssuerIdentifier, requestCredentialsParams.usingActiveAccessToken.credentialConfigurationId)
				if (!flowState) {
					throw new Error("Using active access token: No flowstate");
				}

				// if c_nonce and access_token are not expired
				if (flowState.tokenResponse && Math.floor(Date.now() / 1000) < flowState.tokenResponse.data.c_nonce_expiration_timestamp && Math.floor(Date.now() / 1000) < flowState.tokenResponse.data.expiration_timestamp) {
					// attempt credential request
					if (!flowState.dpop) {
						throw new Error("Using active access token: No dpop in flowstate");
					}

					await credentialRequest(flowState.tokenResponse, flowState);
					return;
				}
				else {
					console.log("Using active access token: c_nonce or access_token are expired");
				}

				// if access_token is expired
				if (flowState.tokenResponse && Math.floor(Date.now() / 1000) > flowState.tokenResponse.data.expiration_timestamp && flowState.tokenResponse.data.refresh_token) {
					// refresh token grant
					await requestCredentials(credentialIssuerIdentifier, {
						dpopNonceHeader: requestCredentialsParams.dpopNonceHeader,
						refreshTokenGrant: {
							credentialConfigurationId: requestCredentialsParams.usingActiveAccessToken.credentialConfigurationId
						}
					})
					return;
				}
				throw new Error("Couldn't hande using active access token");
			}
			// Token Request
			const tokenEndpoint = authzServerMetadata.authzServeMetadata.token_endpoint;


			let flowState: OpenID4VCIClientState | null = null;

			if (requestCredentialsParams?.authorizationCodeGrant) {

				flowState = await openID4VCIClientStateRepository.getByStateAndUserHandle(requestCredentialsParams.authorizationCodeGrant.state)
			}
			else if (requestCredentialsParams?.refreshTokenGrant) {
				flowState = await openID4VCIClientStateRepository.getByCredentialIssuerIdentifierAndCredentialConfigurationIdAndUserHandle(credentialIssuerIdentifier, requestCredentialsParams.refreshTokenGrant.credentialConfigurationId)
			}



			if (!flowState) {
				throw new Error("No flowstate");
			}

			let dpopPrivateKey: jose.KeyLike | Uint8Array | null = null;
			let dpopPrivateKeyJwk: jose.JWK | null = null;
			let dpopPublicKeyJwk: jose.JWK | null = null;

			if (!flowState.dpop) { // if DPoP keys have not been generated, then generate them
				const { privateKey, publicKey } = await jose.generateKeyPair('ES256', { extractable: true }); // keypair for dpop if used
				[dpopPrivateKeyJwk, dpopPublicKeyJwk] = await Promise.all([
					jose.exportJWK(privateKey),
					jose.exportJWK(publicKey)
				]);

				dpopPrivateKey = privateKey;
			}
			else { // if already generated, then reuse them
				dpopPrivateKeyJwk = flowState.dpop.dpopPrivateKeyJwk;
				dpopPublicKeyJwk = flowState.dpop.dpopPublicKeyJwk;

				[dpopPrivateKey] = await Promise.all([
					jose.importJWK(flowState.dpop.dpopPrivateKeyJwk, flowState.dpop.dpopAlg)
				])
			}
			const jti = generateRandomIdentifier(8);

			tokenRequestBuilder.setTokenEndpoint(tokenEndpoint);

			if (authzServerMetadata.authzServeMetadata.dpop_signing_alg_values_supported) {
				await tokenRequestBuilder.setDpopHeader(dpopPrivateKey as jose.KeyLike, dpopPublicKeyJwk, jti);
				flowState.dpop = {
					dpopAlg: 'ES256',
					dpopJti: jti,
					dpopPrivateKeyJwk: dpopPrivateKeyJwk,
					dpopPublicKeyJwk: dpopPublicKeyJwk,
				}
			}


			tokenRequestBuilder.setClientId(clientId ? clientId?.client_id : null);
			tokenRequestBuilder.setGrantType(requestCredentialsParams.authorizationCodeGrant ? GrantType.AUTHORIZATION_CODE : GrantType.REFRESH);
			tokenRequestBuilder.setAuthorizationCode(requestCredentialsParams?.authorizationCodeGrant?.code);
			tokenRequestBuilder.setCodeVerifier(flowState?.code_verifier);

			tokenRequestBuilder.setRefreshToken(flowState?.tokenResponse?.data?.refresh_token);

			tokenRequestBuilder.setRedirectUri(redirectUri);


			const result = await tokenRequestBuilder.execute();

			if ('error' in result) {
				if (result.error === TokenRequestError.AUTHORIZATION_REQUIRED) {
					return generateAuthorizationRequestRef.current(flowState.credentialIssuerIdentifier, flowState.credentialConfigurationId);
				}
				throw new Error("Token request failed");
			}

			try { // try to extract the response and update the OpenID4VCIClientStateRepository
				const { access_token, c_nonce, expires_in, c_nonce_expires_in, refresh_token } = result.response;

				if (!access_token) {
					console.log("Missing access_token from response");
					return;
				}

				flowState.tokenResponse = {
					data: {
						access_token, c_nonce, expiration_timestamp: Math.floor(Date.now() / 1000) + expires_in, c_nonce_expiration_timestamp: Math.floor(Date.now() / 1000) + c_nonce_expires_in, refresh_token
					},
					headers: { ...result.response.httpResponseHeaders }
				}

				await openID4VCIClientStateRepository.updateState(flowState);
			}
			catch (err) {
				console.error(err);
				throw new Error("Failed to extract the response and update the OpenID4VCIClientStateRepository");
			}

			try {
				// Credential Request
				await credentialRequest(flowState.tokenResponse, flowState);
			}
			catch (err) {
				console.error("Error handling authrozation response ", err);
				throw new Error("Credential request failed");
			}
		},
		[
			openID4VCIClientStateRepository,
			openID4VCIHelper,
			credentialRequest,
			tokenRequestBuilder,
		]
	);

	const generateAuthorizationRequestRef = useRef<Function | null>(null);

	const handleAuthorizationResponse = useCallback(
		async (url: string, dpopNonceHeader?: string) => {
			console.log('handleAuthorizationResponse');
			const parsedUrl = new URL(url);

			const code = parsedUrl.searchParams.get('code');
			const state = parsedUrl.searchParams.get('state');

			if (!code) {
				return;
			}

			const s = await openID4VCIClientStateRepository.getByStateAndUserHandle(state);
			console.log("S = ", s)
			if (!s || !s.credentialIssuerIdentifier) {
				console.log("No credential issuer identifier was found in the issuance flow state");
				return;
			}
			if (sessionStorage.getItem('oid4vci_last_used_state') === state) {
				return;
			}

			sessionStorage.setItem('oid4vci_last_used_state', state);
			console.log("Handling authorization response...");
			await requestCredentials(s.credentialIssuerIdentifier, {
				dpopNonceHeader: dpopNonceHeader,
				authorizationCodeGrant: {
					authorizationResponseUrl: url,
					code: code,
					state: state,
				}
			});
		},
		[openID4VCIClientStateRepository, requestCredentials]
	);
	/**
 *
 * @param response
 * @param flowState
 * @param cachedProof cachedProof is used in case a failure due to invalid dpop-nonce is caused and the last proof can be re-used.
 * @returns
 */

	const handleCredentialOffer = useCallback(
		async (credentialOfferURL: string): Promise<{ credentialIssuer: string, selectedCredentialConfigurationId: string; issuer_state?: string }> => {
			console.log('handleCredentialOffer')
			const parsedUrl = new URL(credentialOfferURL);
			let offer;
			if (parsedUrl.searchParams.get("credential_offer")) {
				offer = CredentialOfferSchema.parse(JSON.parse(parsedUrl.searchParams.get("credential_offer")));
			} else {
				try {
					let response = await httpProxy.get(parsedUrl.searchParams.get("credential_offer_uri"), {})
					offer = response.data;
				}
				catch (err) {
					console.error(err);
					return;
				}
			}

			if (!offer.grants.authorization_code) {
				throw new Error("Only authorization_code grant is supported");
			}

			const [credentialIssuerMetadata] = await Promise.all([
				openID4VCIHelper.getCredentialIssuerMetadata(offer.credential_issuer)
			]);

			const selectedConfigurationId = offer.credential_configuration_ids[0];
			const selectedConfiguration = credentialIssuerMetadata.metadata.credential_configurations_supported[selectedConfigurationId];
			if (!selectedConfiguration) {
				throw new Error("Credential configuration not found");
			}

			let issuer_state = undefined;
			if (offer.grants?.authorization_code?.issuer_state) {
				issuer_state = offer.grants.authorization_code.issuer_state;
			}

			return { credentialIssuer: offer.credential_issuer, selectedCredentialConfigurationId: selectedConfigurationId, issuer_state };
		},
		[httpProxy, openID4VCIHelper]
	);

	const getAvailableCredentialConfigurations = useCallback(
		async (credentialIssuerIdentifier: string): Promise<Record<string, CredentialConfigurationSupported>> => {
			console.log('getAvailableCredentialConfigurations')
			const [credentialIssuerMetadata] = await Promise.all([
				openID4VCIHelper.getCredentialIssuerMetadata(credentialIssuerIdentifier)
			]);
			if (!credentialIssuerMetadata.metadata?.credential_configurations_supported) {
				throw new Error("Credential configuration supported not found")
			}
			return credentialIssuerMetadata.metadata?.credential_configurations_supported;
		},
		[openID4VCIHelper]
	);

	const generateAuthorizationRequest = useCallback(
		async (credentialIssuerIdentifier: string, credentialConfigurationId: string, issuer_state?: string) => {
			console.log('generateAuthorizationRequest')
			await openID4VCIClientStateRepository.cleanupExpired();

			try { // attempt to get credentials using active session
				await requestCredentials(credentialIssuerIdentifier, {
					usingActiveAccessToken: {
						credentialConfigurationId
					}
				});
				return { url: "/" };
			}
			catch (err) { console.error(err) }

			const [authzServerMetadata, credentialIssuerMetadata, clientId] = await Promise.all([
				openID4VCIHelper.getAuthorizationServerMetadata(credentialIssuerIdentifier),
				openID4VCIHelper.getCredentialIssuerMetadata(credentialIssuerIdentifier),
				openID4VCIHelper.getClientId(credentialIssuerIdentifier)
			]);

			if (authzServerMetadata.authzServeMetadata.pushed_authorization_request_endpoint) {
				const res = await openID4VCIPushedAuthorizationRequest.generate(
					credentialConfigurationId,
					issuer_state,
					{
						authorizationServerMetadata: authzServerMetadata.authzServeMetadata,
						credentialIssuerMetadata: credentialIssuerMetadata.metadata,
						credentialIssuerIdentifier: credentialIssuerMetadata.metadata.credential_issuer,
						clientId: clientId.client_id,
						redirectUri: redirectUri
					}
				);
				if ('authorizationRequestURL' in res) {
					return { url: res.authorizationRequestURL };
				}
			}
			else if (authzServerMetadata.authzServeMetadata.authorization_challenge_endpoint) {
				await openID4VCIAuthorizationRequestForFirstPartyApplications.generate(
					credentialConfigurationId,
					issuer_state,
					{
						authorizationServerMetadata: authzServerMetadata.authzServeMetadata,
						credentialIssuerMetadata: credentialIssuerMetadata.metadata,
						credentialIssuerIdentifier: credentialIssuerMetadata.metadata.credential_issuer,
						clientId: clientId.client_id,
						redirectUri: redirectUri
					}
				).then((result) => {
					if (!('authorization_code' in result)) {
						console.error("authorization_code was not found in the result");
						return;
					}
					return handleAuthorizationResponse(`openid://?code=${result.authorization_code}&state=${result.state}`);
				});
				return {}
			}
		},
		[openID4VCIClientStateRepository, openID4VCIHelper, handleAuthorizationResponse, openID4VCIAuthorizationRequestForFirstPartyApplications, openID4VCIPushedAuthorizationRequest, requestCredentials]
	);

	// Step 3: Update `useRef` with the `generateAuthorizationRequest` function
	useEffect(() => {
		console.log('call and call')
		generateAuthorizationRequestRef.current = generateAuthorizationRequest;
	}, [generateAuthorizationRequest]);

	return useMemo(() => {
		return {
			generateAuthorizationRequest,
			getAvailableCredentialConfigurations,
			handleCredentialOffer,
			handleAuthorizationResponse
		}
	}, [
		generateAuthorizationRequest,
		getAvailableCredentialConfigurations,
		handleCredentialOffer,
		handleAuthorizationResponse
	]);
}
