import { IOpenID4VCI } from '../../interfaces/IOpenID4VCI';
import { CredentialConfigurationSupported } from '../../schemas/CredentialConfigurationSupportedSchema';
import { OpenID4VCIClientState } from '../../types/OpenID4VCIClientState';
import { generateDPoP } from '../../utils/dpop';
import { CredentialOfferSchema } from '../../schemas/CredentialOfferSchema';
import { StorableCredential } from '../../types/StorableCredential';
import * as jose from 'jose';
import { generateRandomIdentifier } from '../../utils/generateRandomIdentifier';
import * as config from '../../../config';
import { VerifiableCredentialFormat } from '../../schemas/vc';
import { useHttpProxy } from '../HttpProxy/HttpProxy';
import { useOpenID4VCIClientStateRepository } from '../OpenID4VCIClientStateRepository';
import { useContext, useEffect, useMemo } from 'react';
import SessionContext from '../../../context/SessionContext';
import { useOpenID4VCIPushedAuthorizationRequest } from './OpenID4VCIAuthorizationRequest/OpenID4VCIPushedAuthorizationRequest';
import { useOpenID4VCIAuthorizationRequestForFirstPartyApplications } from './OpenID4VCIAuthorizationRequest/OpenID4VCIAuthorizationRequestForFirstPartyApplications';
import { useOpenID4VCIHelper } from '../OpenID4VCIHelper';

const redirectUri = config.OPENID4VCI_REDIRECT_URI as string;

export function useOpenID4VCI(): IOpenID4VCI {

	const httpProxy = useHttpProxy();
	const openID4VCIClientStateRepository = useOpenID4VCIClientStateRepository();
	const { keystore, api } = useContext(SessionContext);

	const openID4VCIHelper = useOpenID4VCIHelper();

	const openID4VCIPushedAuthorizationRequest = useOpenID4VCIPushedAuthorizationRequest();
	const openID4VCIAuthorizationRequestForFirstPartyApplications = useOpenID4VCIAuthorizationRequestForFirstPartyApplications();


	async function handleAuthorizationResponse(url: string, dpopNonceHeader?: string) {

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
	}
	/**
 *
 * @param response
 * @param flowState
 * @param cachedProof cachedProof is used in case a failure due to invalid dpop-nonce is caused and the last proof can be re-used.
 * @returns
 */
	async function credentialRequest(response: any, flowState: OpenID4VCIClientState, cachedProofs?: string[]) {
		const {
			data: { access_token, c_nonce },
		} = response;


		const [authzServerMetadata, credentialIssuerMetadata, clientId] = await Promise.all([
			openID4VCIHelper.getAuthorizationServerMetadata(flowState.credentialIssuerIdentifier),
			openID4VCIHelper.getCredentialIssuerMetadata(flowState.credentialIssuerIdentifier),
			openID4VCIHelper.getClientId(flowState.credentialIssuerIdentifier)
		]);

		const credentialEndpoint = credentialIssuerMetadata.metadata.credential_endpoint;

		let credentialRequestHeaders = {
			"Authorization": `Bearer ${access_token}`,
		};

		if (authzServerMetadata.authzServeMetadata.dpop_signing_alg_values_supported) {
			const privateKey = await jose.importJWK(flowState.dpop.dpopPrivateKeyJwk, flowState.dpop.dpopAlg);

			const newDPoPNonce = response.headers['dpop-nonce'];
			const credentialEndpointDPoP = await generateDPoP(
				privateKey as jose.KeyLike,
				flowState.dpop.dpopPublicKeyJwk,
				flowState.dpop.dpopJti,
				"POST",
				credentialEndpoint,
				newDPoPNonce,
				access_token
			);

			credentialRequestHeaders['Authorization'] = `DPoP ${access_token}`;
			credentialRequestHeaders['dpop'] = credentialEndpointDPoP;
		}

		let proofsArray: string[] = [];
		const numberOfProofs = credentialIssuerMetadata.metadata.batch_credential_issuance?.batch_size ?? 1;
		try {
			const inputs = [];
			for (let i = 0; i < numberOfProofs; i++) {
				inputs.push({
					nonce: c_nonce,
					issuer: clientId.client_id,
					audience: credentialIssuerMetadata.metadata.credential_issuer
				})
			}

			if (cachedProofs) {
				proofsArray = cachedProofs;
			}
			else {
				const [{ proof_jwts }, newPrivateData, keystoreCommit] = await keystore.generateOpenid4vciProofs(inputs);
				await api.updatePrivateData(newPrivateData);
				await keystoreCommit();
				proofsArray = proof_jwts;
			}
		}
		catch (err) {
			console.error(err);
			throw new Error("Failed to generate proof");
		}

		const credentialConfigurationSupported = credentialIssuerMetadata.metadata.credential_configurations_supported[flowState.credentialConfigurationId];

		const credentialEndpointBody = {
			"format": credentialIssuerMetadata.metadata.credential_configurations_supported[flowState.credentialConfigurationId].format,
		} as any;

		if (credentialIssuerMetadata.metadata?.batch_credential_issuance?.batch_size) {
			credentialEndpointBody.proofs = {
				jwt: proofsArray
			}
		}
		else {
			credentialEndpointBody.proof = {
				proof_type: "jwt",
				jwt: proofsArray[0],
			}
		}

		if (credentialConfigurationSupported.format === VerifiableCredentialFormat.SD_JWT_VC && credentialConfigurationSupported.vct) {
			credentialEndpointBody.vct = credentialConfigurationSupported.vct;
		}
		else if (credentialConfigurationSupported.format === VerifiableCredentialFormat.MSO_MDOC && credentialConfigurationSupported.doctype) {
			credentialEndpointBody.doctype = credentialConfigurationSupported.doctype;
		}

		const credentialResponse = await httpProxy.post(credentialEndpoint, credentialEndpointBody, credentialRequestHeaders);

		if (credentialResponse.err) {
			console.log("Error: Credential response = ", JSON.stringify(credentialResponse.err));
			if (credentialResponse.err.headers["www-authenticate"].includes("invalid_dpop_proof") && "dpop-nonce" in credentialResponse.err.headers) {
				console.log("Calling credentialRequest with new dpop-nonce....")

				response.headers['dpop-nonce'] = credentialResponse.err.headers["dpop-nonce"];
				await credentialRequest(response, flowState, proofsArray);
				return;
			}
			throw new Error("Credential Request failed");
		}
		console.log("Credential response = ", credentialResponse)


		const credentialArray = [];
		if (numberOfProofs == 1 && credentialResponse.data.credential) {
			const { credential } = credentialResponse.data;
			credentialArray.push(credential);
		}
		else {
			credentialArray.push(...credentialResponse.data.credentials);
		}
		const new_c_nonce = credentialResponse.data.c_nonce;
		const new_c_nonce_expires_in = credentialResponse.data.c_nonce_expires_in;

		if (new_c_nonce && new_c_nonce_expires_in) {
			flowState.tokenResponse.data.c_nonce = new_c_nonce;
			flowState.tokenResponse.data.c_nonce_expiration_timestamp = Math.floor(Date.now() / 1000) + new_c_nonce_expires_in;
			await openID4VCIClientStateRepository.updateState(flowState);
		}

		await openID4VCIClientStateRepository.cleanupExpired();

		const identifier = generateRandomIdentifier(32);
		const storableCredentials: StorableCredential[] = credentialArray.map((credential, index) => ({
			credentialIdentifier: identifier,
			credential: credential,
			format: credentialIssuerMetadata.metadata.credential_configurations_supported[flowState.credentialConfigurationId].format,
			credentialConfigurationId: flowState.credentialConfigurationId,
			credentialIssuerIdentifier: credentialIssuerMetadata.metadata.credential_issuer,
			sigCount: 0,
			instanceId: index,
		}));

		await api.post('/storage/vc', {
			credentials: storableCredentials
		});
		return;

	}


	async function requestCredentials(credentialIssuerIdentifier: string, requestCredentialsParams: {
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
	}) {

		const [authzServerMetadata, credentialIssuerMetadata, clientId] = await Promise.all([
			openID4VCIHelper.getAuthorizationServerMetadata(credentialIssuerIdentifier),
			openID4VCIHelper.getCredentialIssuerMetadata(credentialIssuerIdentifier),
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
		let dpopPublicKey: jose.KeyLike | Uint8Array | null = null;
		let dpopPublicKeyJwk: jose.JWK | null = null;

		if (!flowState.dpop) { // if DPoP keys have not been generated, then generate them
			const { privateKey, publicKey } = await jose.generateKeyPair('ES256', { extractable: true }); // keypair for dpop if used
			[dpopPrivateKeyJwk, dpopPublicKeyJwk] = await Promise.all([
				jose.exportJWK(privateKey),
				jose.exportJWK(publicKey)
			]);

			dpopPrivateKey = privateKey;
			dpopPublicKey = publicKey;
		}
		else { // if already generated, then reuse them
			dpopPrivateKeyJwk = flowState.dpop.dpopPrivateKeyJwk;
			dpopPublicKeyJwk = flowState.dpop.dpopPublicKeyJwk;

			[dpopPrivateKey, dpopPublicKey] = await Promise.all([
				jose.importJWK(flowState.dpop.dpopPrivateKeyJwk, flowState.dpop.dpopAlg),
				jose.importJWK(flowState.dpop.dpopPublicKeyJwk, flowState.dpop.dpopAlg)
			])
		}
		const jti = generateRandomIdentifier(8);

		let tokenRequestHeaders = {
			'Content-Type': 'application/x-www-form-urlencoded',
		};

		if (authzServerMetadata.authzServeMetadata.dpop_signing_alg_values_supported) {
			const dpop = await generateDPoP(
				dpopPrivateKey as jose.KeyLike,
				dpopPublicKeyJwk,
				jti,
				"POST",
				tokenEndpoint,
				requestCredentialsParams.dpopNonceHeader
			);
			flowState.dpop = {
				dpopAlg: 'ES256',
				dpopJti: jti,
				dpopPrivateKeyJwk: dpopPrivateKeyJwk,
				dpopPublicKeyJwk: dpopPublicKeyJwk,
			}
			tokenRequestHeaders['DPoP'] = dpop;
		}


		const formData = new URLSearchParams();
		formData.append('client_id', clientId.client_id);
		if (requestCredentialsParams.authorizationCodeGrant) {
			formData.append('grant_type', 'authorization_code');
			formData.append('code', requestCredentialsParams.authorizationCodeGrant.code);
			formData.append('code_verifier', flowState.code_verifier);
		}
		else if (requestCredentialsParams.refreshTokenGrant) {
			if (!flowState?.tokenResponse?.data.refresh_token) {
				console.info("Found no refresh_token to execute refesh_token grant")
				throw new Error("Found no refresh_token to execute refesh_token grant");
			}
			formData.append('grant_type', 'refresh_token');
			formData.append('refresh_token', flowState.tokenResponse.data.refresh_token);
		}
		else {
			throw new Error("No grant type selected in requestCredentials()");
		}
		formData.append('redirect_uri', redirectUri);

		const response = await httpProxy.post(tokenEndpoint, formData.toString(), tokenRequestHeaders);

		if (response.err) {
			const { err } = response;
			console.log("failed token request")
			console.log(JSON.stringify(err));
			console.log("Dpop nonce found = ", err.headers['dpop-nonce'])
			if (err.headers['dpop-nonce']) {
				requestCredentialsParams.dpopNonceHeader = err.headers['dpop-nonce'];
				if (requestCredentialsParams.dpopNonceHeader) {
					await requestCredentials(credentialIssuerIdentifier, requestCredentialsParams);
					return;
				}
			}
			else if (err.data.error) {
				console.error("OID4VCI Token Response Error: ", JSON.stringify(err.data))
			}
			return;
		}

		console.log("== response = ", response)
		try { // try to extract the response and update the OpenID4VCIClientStateRepository
			const {
				data: { access_token, c_nonce, expires_in, c_nonce_expires_in, refresh_token },
			} = response;

			if (!access_token) {
				console.log("Missing access_token from response");
				return;
			}

			flowState.tokenResponse = {
				data: {
					access_token, c_nonce, expiration_timestamp: Math.floor(Date.now() / 1000) + expires_in, c_nonce_expiration_timestamp: Math.floor(Date.now() / 1000) + c_nonce_expires_in, refresh_token
				},
				headers: { ...response.headers }
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
	}


	async function handleCredentialOffer(credentialOfferURL: string): Promise<{ credentialIssuer: string, selectedCredentialConfigurationId: string; issuer_state?: string }> {
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

		const [authzServerMetadata, credentialIssuerMetadata] = await Promise.all([
			openID4VCIHelper.getAuthorizationServerMetadata(offer.credential_issuer),
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
	}

	async function getAvailableCredentialConfigurations(credentialIssuerIdentifier: string): Promise<Record<string, CredentialConfigurationSupported>> {
		const [authzServerMetadata, credentialIssuerMetadata] = await Promise.all([
			openID4VCIHelper.getAuthorizationServerMetadata(credentialIssuerIdentifier),
			openID4VCIHelper.getCredentialIssuerMetadata(credentialIssuerIdentifier)
		]);
		if (!credentialIssuerMetadata.metadata?.credential_configurations_supported) {
			throw new Error("Credential configuration supported not found")
		}
		return credentialIssuerMetadata.metadata?.credential_configurations_supported;
	}

	async function generateAuthorizationRequest(credentialIssuerIdentifier: string, credentialConfigurationId: string, issuer_state?: string): Promise<{ url?: string; }> {
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
	}


	return useMemo(() => {
		return {
			generateAuthorizationRequest,
			getAvailableCredentialConfigurations,
			handleCredentialOffer,
			handleAuthorizationResponse
		}
	}, [httpProxy, openID4VCIHelper, openID4VCIClientStateRepository, api, keystore])

}
