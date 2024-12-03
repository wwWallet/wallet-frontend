import { IOpenID4VCIClient } from '../interfaces/IOpenID4VCIClient';
import { IHttpProxy } from '../interfaces/IHttpProxy';
import { ClientConfig } from '../types/ClientConfig';
import { IOpenID4VCIClientStateRepository } from '../interfaces/IOpenID4VCIClientStateRepository';
import { CredentialConfigurationSupported } from '../schemas/CredentialConfigurationSupportedSchema';
import { OpenID4VCIClientState } from '../types/OpenID4VCIClientState';
import { generateDPoP } from '../utils/dpop';
import { CredentialOfferSchema } from '../schemas/CredentialOfferSchema';
import { StorableCredential } from '../types/StorableCredential';
import * as jose from 'jose';
import { generateRandomIdentifier } from '../utils/generateRandomIdentifier';
import * as config from '../../config';
import { VerifiableCredentialFormat } from '../schemas/vc';
import { IOpenID4VCIAuthorizationRequest } from '../interfaces/IOpenID4VCIAuthorizationRequest';
import { OpenID4VCIPushedAuthorizationRequest } from './OpenID4VCIAuthorizationRequest/OpenID4VCIPushedAuthorizationRequest';
import { OpenID4VCIAuthorizationRequestForFirstPartyApplications } from './OpenID4VCIAuthorizationRequest/OpenID4VCIAuthorizationRequestForFirstPartyApplications';
import { IOpenID4VPRelyingParty } from '../interfaces/IOpenID4VPRelyingParty';

const redirectUri = config.OPENID4VCI_REDIRECT_URI as string;

export class OpenID4VCIClient implements IOpenID4VCIClient {

	private openID4VCIPushedAuthorizationRequest: IOpenID4VCIAuthorizationRequest;
	private openID4VCIAuthorizationRequestForFirstPartyApplications: IOpenID4VCIAuthorizationRequest;

	constructor(private config: ClientConfig,
		private httpProxy: IHttpProxy,
		private openID4VCIClientStateRepository: IOpenID4VCIClientStateRepository,
		private openID4VPRelyingParty: IOpenID4VPRelyingParty,
		private generateNonceProofs: (requests: { nonce: string, audience: string, issuer: string }[]) => Promise<{ proof_jwts: string[] }>,
		private storeCredentials: (cList: StorableCredential[]) => Promise<void>,
	) {
		this.openID4VCIPushedAuthorizationRequest = new OpenID4VCIPushedAuthorizationRequest(this.httpProxy, this.openID4VCIClientStateRepository);
		this.openID4VCIAuthorizationRequestForFirstPartyApplications = new OpenID4VCIAuthorizationRequestForFirstPartyApplications(this.httpProxy, this.openID4VCIClientStateRepository, this.openID4VPRelyingParty);
	}

	async handleCredentialOffer(credentialOfferURL: string, userHandleB64u: string): Promise<{ credentialIssuer: string, selectedCredentialConfigurationId: string; issuer_state?: string }> {
		const parsedUrl = new URL(credentialOfferURL);
		let offer;
		if (parsedUrl.searchParams.get("credential_offer")) {
			offer = CredentialOfferSchema.parse(JSON.parse(parsedUrl.searchParams.get("credential_offer")));
		} else {
			try {
				let response = await this.httpProxy.get(parsedUrl.searchParams.get("credential_offer_uri"), {})
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

		if (offer.credential_issuer !== this.config.credentialIssuerIdentifier) {
			return;
		}

		const selectedConfigurationId = offer.credential_configuration_ids[0];
		const selectedConfiguration = this.config.credentialIssuerMetadata.credential_configurations_supported[selectedConfigurationId];
		if (!selectedConfiguration) {
			throw new Error("Credential configuration not found");
		}

		let issuer_state = undefined;
		if (offer.grants?.authorization_code?.issuer_state) {
			issuer_state = offer.grants.authorization_code.issuer_state;
		}

		return { credentialIssuer: offer.credential_issuer, selectedCredentialConfigurationId: selectedConfigurationId, issuer_state };
	}

	async getAvailableCredentialConfigurations(): Promise<Record<string, CredentialConfigurationSupported>> {
		if (!this?.config?.credentialIssuerMetadata?.credential_configurations_supported) {
			throw new Error("Credential configuration supported not found")
		}
		return this.config.credentialIssuerMetadata.credential_configurations_supported
	}

	async generateAuthorizationRequest(credentialConfigurationId: string, userHandleB64u: string, issuer_state?: string): Promise<{ url?: string; }> {
		await this.openID4VCIClientStateRepository.cleanupExpired(userHandleB64u);

		try { // attempt to get credentials using active session
			await this.requestCredentials({
				userHandleB64u,
				usingActiveAccessToken: {
					credentialConfigurationId
				}
			});
			return { url: "/" };
		}
		catch (err) { console.error(err) }

		if (this.config.authorizationServerMetadata.authorization_challenge_endpoint) {
			await this.openID4VCIAuthorizationRequestForFirstPartyApplications.generate(
				credentialConfigurationId,
				userHandleB64u,
				issuer_state,
				{
					...this.config,
					redirectUri: redirectUri
				}
			).then((result) => {
				if (!('authorization_code' in result)) {
					console.error("authorization_code was not found in the result");
					return;
				}
				return this.handleAuthorizationResponse(`openid://?code=${result.authorization_code}&state=${result.state}`, userHandleB64u);
			});
			return { }
		}
		else if (this.config.authorizationServerMetadata.pushed_authorization_request_endpoint) {
			const res = await this.openID4VCIPushedAuthorizationRequest.generate(
				credentialConfigurationId,
				userHandleB64u,
				issuer_state,
				{
					...this.config,
					redirectUri: redirectUri
				}
			);
			if ('authorizationRequestURL' in res) {
				return { url: res.authorizationRequestURL };
			}
		}
	}

	async handleAuthorizationResponse(url: string, userHandleB64U: string, dpopNonceHeader?: string) {
		const parsedUrl = new URL(url);

		const code = parsedUrl.searchParams.get('code');
		const state = parsedUrl.searchParams.get('state');

		if (!code) {
			return;
		}
		const s = await this.openID4VCIClientStateRepository.getByStateAndUserHandle(state, userHandleB64U);
		if (!s || !s.credentialIssuerIdentifier || s.credentialIssuerIdentifier !== this.config.credentialIssuerIdentifier) {
			return;
		}
		if (sessionStorage.getItem('oid4vci_last_used_state') === state) {
			return;
		}
		sessionStorage.setItem('oid4vci_last_used_state', state);
		console.log("Handling authorization response...");
		await this.requestCredentials({
			userHandleB64u: userHandleB64U,
			dpopNonceHeader: dpopNonceHeader,
			authorizationCodeGrant: {
				authorizationResponseUrl: url,
				code: code,
				state: state,
			}
		});
	}

	private async requestCredentials(requestCredentialsParams: {
		userHandleB64u: string,
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


		if (requestCredentialsParams.usingActiveAccessToken) {
			console.log("Attempting with active access token")
			const flowState = await this.openID4VCIClientStateRepository.getByCredentialIssuerIdentifierAndCredentialConfigurationIdAndUserHandle(this.config.credentialIssuerIdentifier, requestCredentialsParams.usingActiveAccessToken.credentialConfigurationId, requestCredentialsParams.userHandleB64u)
			if (!flowState) {
				throw new Error("Using active access token: No flowstate");
			}

			// if c_nonce and access_token are not expired
			if (flowState.tokenResponse && Math.floor(Date.now() / 1000) < flowState.tokenResponse.data.c_nonce_expiration_timestamp && Math.floor(Date.now() / 1000) < flowState.tokenResponse.data.expiration_timestamp) {
				// attempt credential request
				if (!flowState.dpop) {
					throw new Error("Using active access token: No dpop in flowstate");
				}

				await this.credentialRequest(flowState.tokenResponse, flowState);
				return;
			}
			else {
				console.log("Using active access token: c_nonce or access_token are expired");
			}

			// if access_token is expired
			if (flowState.tokenResponse && Math.floor(Date.now() / 1000) > flowState.tokenResponse.data.expiration_timestamp) {
				// refresh token grant
				await this.requestCredentials({
					userHandleB64u: requestCredentialsParams.userHandleB64u,
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
		const tokenEndpoint = this.config.authorizationServerMetadata.token_endpoint;


		let flowState: OpenID4VCIClientState | null = null;

		if (requestCredentialsParams?.authorizationCodeGrant) {
			flowState = await this.openID4VCIClientStateRepository.getByStateAndUserHandle(requestCredentialsParams.authorizationCodeGrant.state, requestCredentialsParams.userHandleB64u)
		}
		else if (requestCredentialsParams?.refreshTokenGrant) {
			flowState = await this.openID4VCIClientStateRepository.getByCredentialIssuerIdentifierAndCredentialConfigurationIdAndUserHandle(this.config.credentialIssuerIdentifier, requestCredentialsParams.refreshTokenGrant.credentialConfigurationId, requestCredentialsParams.userHandleB64u)
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

		if (this.config.authorizationServerMetadata.dpop_signing_alg_values_supported) {
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
		formData.append('client_id', this.config.clientId);
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

		const response = await this.httpProxy.post(tokenEndpoint, formData.toString(), tokenRequestHeaders);

		if (response.err) {
			const { err } = response;
			console.log("failed token request")
			console.log(JSON.stringify(err));
			console.log("Dpop nonce found = ", err.headers['dpop-nonce'])
			if (err.headers['dpop-nonce']) {
				requestCredentialsParams.dpopNonceHeader = err.headers['dpop-nonce'];
				if (requestCredentialsParams.dpopNonceHeader) {
					await this.requestCredentials(requestCredentialsParams);
					// this.handleAuthorizationResponse(requestCredentialsParams.authorizationCodeGrant.authorizationResponseUrl, requestCredentialsParams.userHandleB64u, requestCredentialsParams.dpopNonceHeader);
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

			await this.openID4VCIClientStateRepository.updateState(flowState, requestCredentialsParams.userHandleB64u);
		}
		catch (err) {
			console.error(err);
			throw new Error("Failed to extract the response and update the OpenID4VCIClientStateRepository");
		}

		try {
			// Credential Request
			await this.credentialRequest(flowState.tokenResponse, flowState);
		}
		catch (err) {
			console.error("Error handling authrozation response ", err);
			throw new Error("Credential request failed");
		}
	}

	/**
	 *
	 * @param response
	 * @param flowState
	 * @param cachedProof cachedProof is used in case a failure due to invalid dpop-nonce is caused and the last proof can be re-used.
	 * @returns
	 */
	private async credentialRequest(response: any, flowState: OpenID4VCIClientState, cachedProofs?: string[]) {
		const {
			data: { access_token, c_nonce },
		} = response;


		const credentialEndpoint = this.config.credentialIssuerMetadata.credential_endpoint;

		let credentialRequestHeaders = {
			"Authorization": `Bearer ${access_token}`,
		};

		if (this.config.authorizationServerMetadata.dpop_signing_alg_values_supported) {
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
		const numberOfProofs = this.config.credentialIssuerMetadata.batch_credential_issuance?.batch_size ?? 1;
		try {
			const inputs = [];
			for (let i = 0; i < numberOfProofs; i++) {
				inputs.push({
					nonce: c_nonce,
					issuer: this.config.clientId,
					audience: this.config.credentialIssuerIdentifier
				})
			}
			const generateProofsResult = cachedProofs ? { proof_jwts: cachedProofs } : await this.generateNonceProofs(inputs);
			proofsArray = generateProofsResult.proof_jwts;
			if (proofsArray) {
				dispatchEvent(new CustomEvent("generatedProof"));
			}
		}
		catch (err) {
			console.error(err);
			throw new Error("Failed to generate proof");
		}

		const credentialConfigurationSupported = this.config.credentialIssuerMetadata.credential_configurations_supported[flowState.credentialConfigurationId];

		const credentialEndpointBody = {
			"format": this.config.credentialIssuerMetadata.credential_configurations_supported[flowState.credentialConfigurationId].format,
		} as any;

		if (this.config.credentialIssuerMetadata?.batch_credential_issuance?.batch_size) {
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

		const credentialResponse = await this.httpProxy.post(credentialEndpoint, credentialEndpointBody, credentialRequestHeaders);

		if (credentialResponse.err) {
			console.log("Error: Credential response = ", JSON.stringify(credentialResponse.err));
			if (credentialResponse.err.headers["www-authenticate"].includes("invalid_dpop_proof") && "dpop-nonce" in credentialResponse.err.headers) {
				console.log("Calling credentialRequest with new dpop-nonce....")

				response.headers['dpop-nonce'] = credentialResponse.err.headers["dpop-nonce"];
				await this.credentialRequest(response, flowState, proofsArray);
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
			await this.openID4VCIClientStateRepository.updateState(flowState, flowState.userHandleB64U);
		}

		await this.openID4VCIClientStateRepository.cleanupExpired(flowState.userHandleB64U);

		const identifier = generateRandomIdentifier(32);
		const storableCredentials: StorableCredential[] = credentialArray.map((credential, index) => ({
			credentialIdentifier: identifier,
			credential: credential,
			format: this.config.credentialIssuerMetadata.credential_configurations_supported[flowState.credentialConfigurationId].format,
			credentialConfigurationId: flowState.credentialConfigurationId,
			credentialIssuerIdentifier: this.config.credentialIssuerIdentifier,
			sigCount: 0,
			instanceId: index,
		}));

		this.storeCredentials(storableCredentials).then(() => {
			dispatchEvent(new CustomEvent('newCredential'));
		});

		return;

	}
}
