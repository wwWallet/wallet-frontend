import { IOpenID4VCIClient } from '../interfaces/IOpenID4VCIClient';
import { IHttpProxy } from '../interfaces/IHttpProxy';
import { ClientConfig } from '../types/ClientConfig';
import pkce from 'pkce-challenge';
import { IOpenID4VCIClientStateRepository } from '../interfaces/IOpenID4VCIClientStateRepository';
import { CredentialConfigurationSupported } from '../schemas/CredentialConfigurationSupportedSchema';
import { OpenID4VCIClientState } from '../types/OpenID4VCIClientState';
import { generateDPoP } from '../utils/dpop';
import { CredentialOfferSchema } from '../schemas/CredentialOfferSchema';
import { StorableCredential } from '../types/StorableCredential';
import * as jose from 'jose';
import { generateRandomIdentifier } from '../utils/generateRandomIdentifier';

const redirectUri = process.env.REACT_APP_OPENID4VCI_REDIRECT_URI as string;

export class OpenID4VCIClient implements IOpenID4VCIClient {

	constructor(private config: ClientConfig,
		private httpProxy: IHttpProxy,
		private openID4VCIClientStateRepository: IOpenID4VCIClientStateRepository,
		private generateNonceProof: (cNonce: string, audience: string, clientId: string) => Promise<{ jws: string }>,
		private storeCredential: (c: StorableCredential) => Promise<void>
	) { }


	async handleCredentialOffer(credentialOfferURL: string): Promise<{ credentialIssuer: string, selectedCredentialConfigurationSupported: CredentialConfigurationSupported; issuer_state?: string }> {
		const parsedUrl = new URL(credentialOfferURL);
		const offer = CredentialOfferSchema.parse(JSON.parse(parsedUrl.searchParams.get("credential_offer")));

		if (!offer.grants.authorization_code) {
			throw new Error("Only authorization_code grant is supported");
		}

		if (offer.credential_issuer != this.config.credentialIssuerIdentifier) {
			throw new Error("Unable to handle this credential offer");
		}

		const selectedConfigurationId = offer.credential_configuration_ids[0];
		const selectedConfiguration = this.config.credentialIssuerMetadata.credential_configurations_supported[selectedConfigurationId];
		if (!selectedConfiguration) {
			throw new Error("Credential configuration not found");
		}

		let issuer_state = undefined;
		if (offer.grants?.authorization_code?.issuer_state) {
			issuer_state = offer.credential_issuer, offer.grants.authorization_code.issuer_state;
		}

		return { credentialIssuer: offer.credential_issuer, selectedCredentialConfigurationSupported: selectedConfiguration, issuer_state };
	}

	async getAvailableCredentialConfigurations(): Promise<Record<string, CredentialConfigurationSupported>> {
		if (!this?.config?.credentialIssuerMetadata?.credential_configurations_supported) {
			throw new Error("Credential configuration supported not found")
		}
		return this.config.credentialIssuerMetadata.credential_configurations_supported
	}

	async generateAuthorizationRequest(selectedCredentialConfigurationSupported: CredentialConfigurationSupported, userHandleB64u: string, issuer_state?: string): Promise<{ url: string; client_id: string; request_uri: string; }> {
		const { code_challenge, code_verifier } = await pkce();

		const formData = new URLSearchParams();

		formData.append("scope", selectedCredentialConfigurationSupported.scope);

		formData.append("response_type", "code");

		formData.append("client_id", this.config.clientId);
		formData.append("code_challenge", code_challenge);

		formData.append("code_challenge_method", "S256");

		formData.append("state", btoa(JSON.stringify({ userHandleB64u: userHandleB64u })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, ""));

		if (issuer_state) {
			formData.append("issuer_state", issuer_state);
		}

		formData.append("redirect_uri", redirectUri);
		let res;
		try {
			res = await this.httpProxy.post(this.config.authorizationServerMetadata.pushed_authorization_request_endpoint, formData.toString(), {
				'Content-Type': 'application/x-www-form-urlencoded'
			});
		}
		catch (err) {
			throw new Error("Pushed authorization request failed ", err.response.data)
		}

		const { request_uri } = res.data;
		const authorizationRequestURL = `${this.config.authorizationServerMetadata.authorization_endpoint}?request_uri=${request_uri}&client_id=${this.config.clientId}`

		await this.openID4VCIClientStateRepository.store(new OpenID4VCIClientState(code_verifier, "", selectedCredentialConfigurationSupported));

		return {
			url: authorizationRequestURL,
			request_uri,
			client_id: this.config.clientId,
		}
	}

	async handleAuthorizationResponse(url: string, dpopNonceHeader?: string) {
		const parsedUrl = new URL(url);

		const code = parsedUrl.searchParams.get('code');
		if (!code) {
			throw new Error("Could not handle authorization response");
		}


		const jti = generateRandomIdentifier(8);
		// Token Request
		const tokenEndpoint = this.config.authorizationServerMetadata.token_endpoint;

		const { privateKey, publicKey } = await jose.generateKeyPair('ES256'); // keypair for dpop if used

		const flowState = await this.openID4VCIClientStateRepository.retrieve();

		let tokenRequestHeaders = {
			'Content-Type': 'application/x-www-form-urlencoded',
		};

		if (this.config.authorizationServerMetadata.dpop_signing_alg_values_supported) {
			const dpop = await generateDPoP(
				privateKey,
				publicKey,
				jti,
				"POST",
				tokenEndpoint,
				dpopNonceHeader
			);
			flowState.dpopJti = jti;

			tokenRequestHeaders['DPoP'] = dpop;
		}

		await this.openID4VCIClientStateRepository.store(flowState);
		const formData = new URLSearchParams();
		formData.append('grant_type', 'authorization_code');
		formData.append('code', code);
		formData.append('code_verifier', flowState.code_verifier);
		formData.append('redirect_uri', redirectUri);

		let response;
		try {
			response = await this.httpProxy.post(tokenEndpoint, formData.toString(), tokenRequestHeaders);
		}
		catch (err) {
			console.log("failed token request")
			console.error(err);
			dpopNonceHeader = err.response.data.err.headers['dpop-nonce'];
			if (dpopNonceHeader) {
				this.handleAuthorizationResponse(url, dpopNonceHeader);
				return;
			}
			return;
		}

		try {
			// Credential Request
			await this.credentialRequest(response, flowState, privateKey, publicKey);
		}
		catch (err) {
			console.error("Error handling authrozation response ", err);
		}
	}

	private async credentialRequest(response: any, flowState: OpenID4VCIClientState, privateKey?: jose.KeyLike, publicKey?: jose.KeyLike) {
		const {
			data: { access_token, c_nonce },
		} = response;
		const credentialEndpoint = this.config.credentialIssuerMetadata.credential_endpoint;

		let credentialRequestHeaders = {
			"Authorization": `Bearer ${access_token}`,
		};

		if (this.config.authorizationServerMetadata.dpop_signing_alg_values_supported) {
			const newDPoPNonce = response.headers['dpop-nonce'];
			const credentialEndpointDPoP = await generateDPoP(
				privateKey,
				publicKey,
				flowState.dpopJti,
				"POST",
				credentialEndpoint,
				newDPoPNonce,
				access_token
			);

			credentialRequestHeaders['Authorization'] = `DPoP ${access_token}`;
			credentialRequestHeaders['dpop'] = credentialEndpointDPoP;
		}

		const { jws } = await this.generateNonceProof(c_nonce, this.config.credentialIssuerIdentifier, this.config.clientId);
		const credentialEndpointBody = {
			"proof": {
				"proof_type": "jwt",
				"jwt": jws,
			},
			"format": flowState.selectedCredentialConfiguration.format,
			...flowState.selectedCredentialConfiguration, // include credential_definition, vct, doctype etc.
		};

		try {
			const credentialResponse = await this.httpProxy.post(credentialEndpoint, credentialEndpointBody, credentialRequestHeaders);
			const { credential } = credentialResponse.data;
			await this.storeCredential({
				credentialIdentifier: generateRandomIdentifier(32),
				credential: credential,
				format: flowState.selectedCredentialConfiguration.format,
			});
		}
		catch (err) {
			console.error("Failed to recieve credential during issuance protocol");
			console.error(err);
		}
	}
}
