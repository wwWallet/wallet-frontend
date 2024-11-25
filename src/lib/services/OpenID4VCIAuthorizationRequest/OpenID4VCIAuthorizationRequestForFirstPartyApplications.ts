import { IOpenID4VCIAuthorizationRequest } from "../../interfaces/IOpenID4VCIAuthorizationRequest";
import { OpenidAuthorizationServerMetadata } from "../../schemas/OpenidAuthorizationServerMetadataSchema";
import pkce from 'pkce-challenge';
import { OpenidCredentialIssuerMetadata } from "../../schemas/OpenidCredentialIssuerMetadataSchema";
import { generateRandomIdentifier } from "../../utils/generateRandomIdentifier";
import { IHttpProxy } from "../../interfaces/IHttpProxy";
import { OpenID4VCIClientState } from "../../types/OpenID4VCIClientState";
import { IOpenID4VCIClientStateRepository } from "../../interfaces/IOpenID4VCIClientStateRepository";
import { IOpenID4VPRelyingParty } from "../../interfaces/IOpenID4VPRelyingParty";

export class OpenID4VCIAuthorizationRequestForFirstPartyApplications implements IOpenID4VCIAuthorizationRequest {

	constructor(
		private httpProxy: IHttpProxy,
		private openID4VCIClientStateRepository: IOpenID4VCIClientStateRepository,
		private openID4VPRelyingParty: IOpenID4VPRelyingParty,
	) { }

	async generate(credentialConfigurationId: string, userHandleB64u: string, issuer_state: string | undefined, config: {
		credentialIssuerIdentifier: string,
		redirectUri: string,
		clientId: string,
		authorizationServerMetadata: OpenidAuthorizationServerMetadata,
		credentialIssuerMetadata: OpenidCredentialIssuerMetadata,
	}): Promise<string> {
		const { code_challenge, code_verifier } = await pkce();

		const formData = new URLSearchParams();

		const selectedCredentialConfigurationSupported = config.credentialIssuerMetadata.credential_configurations_supported[credentialConfigurationId];
		formData.append("scope", selectedCredentialConfigurationSupported.scope);
		formData.append("client_id", config.clientId);

		formData.append("code_challenge", code_challenge);

		formData.append("code_challenge_method", "S256");

		// the purpose of the "id" is to provide the "state" a random factor for unlinkability and to make OpenID4VCIClientState instances unique
		const state = btoa(JSON.stringify({ userHandleB64u: userHandleB64u, id: generateRandomIdentifier(12) })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
		formData.append("state", state);

		if (issuer_state) {
			formData.append("issuer_state", issuer_state);
		}

		formData.append("redirect_uri", config.redirectUri);
		let res;
		try {
			res = await this.httpProxy.post(config.authorizationServerMetadata.authorization_challenge_endpoint, formData.toString(), {
				'Content-Type': 'application/x-www-form-urlencoded'
			});
		}
		catch (err) {
			if (err?.response?.data && err?.response?.data?.error === "insufficient_authorization") { // Authorization Error Response
				const { error, auth_session, presentation } = err?.response?.data;
				
				// this function should prompt the user for presentation selection
				const generatedPresentation = await this.openID4VPRelyingParty.handleAuthorizationRequest("openid4vp:" + presentation).then((res) => {
					if ('err' in res) {
						return;
					}

					const jsonedMap = Object.fromEntries(res.conformantCredentialsMap);
					return this.openID4VPRelyingParty.promptForCredentialSelection(jsonedMap, "");
				}).then((selectionMap) => {
					return this.openID4VPRelyingParty.sendAuthorizationResponse(selectionMap); // returns presentation
				})
				

			}
			else {
				console.error(err);
				throw new Error("Pushed authorization request failed")
			}
		}

		const { request_uri } = res.data;
		const authorizationRequestURL = `${config.authorizationServerMetadata.authorization_endpoint}?request_uri=${request_uri}&client_id=${config.clientId}`

		await this.openID4VCIClientStateRepository.create(new OpenID4VCIClientState(userHandleB64u, config.credentialIssuerIdentifier, state, code_verifier, credentialConfigurationId))
		return authorizationRequestURL;
	}
}
