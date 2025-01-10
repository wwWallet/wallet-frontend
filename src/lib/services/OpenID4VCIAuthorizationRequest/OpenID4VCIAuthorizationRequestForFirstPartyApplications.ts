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
	}): Promise<{ authorizationRequestURL: string } | { authorization_code: string; state: string; }> {
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
			console.log("Res = ", res)
			const err = res.err;
			if (err) {
				if (err?.data && err?.data?.error === "insufficient_authorization") { // Authorization Error Response
					const { error, auth_session, presentation } = err?.data;

					// this function should prompt the user for presentation selection
					const result = await this.openID4VPRelyingParty.handleAuthorizationRequest("openid4vp:" + presentation).then((res) => {
						if ('err' in res) {
							return;
						}

						const jsonedMap = Object.fromEntries(res.conformantCredentialsMap);
						return this.openID4VPRelyingParty.promptForCredentialSelection(jsonedMap, config.credentialIssuerMetadata.credential_issuer);
					}).then((selectionMap) => {
						return this.openID4VPRelyingParty.sendAuthorizationResponse(selectionMap);
					});

					if (!('presentation_during_issuance_session' in result)) {
						throw new Error("presentation_during_issuance_session is not present in the result of the presentation sending phase");
					}
					const presentation_during_issuance_session = result.presentation_during_issuance_session;
					// add auth_session and presentation_during_issuance_session params on authorization_challenge_endpoint POST request
					formData.append("auth_session", auth_session);
					formData.append("presentation_during_issuance_session", presentation_during_issuance_session);
					res = await this.httpProxy.post(config.authorizationServerMetadata.authorization_challenge_endpoint, formData.toString(), {
						'Content-Type': 'application/x-www-form-urlencoded'
					});

					if (!res.data.authorization_code) {
						throw new Error("authorization_code not present on the authorization response");
					}
					await this.openID4VCIClientStateRepository.create(new OpenID4VCIClientState(userHandleB64u, config.credentialIssuerIdentifier, state, code_verifier, credentialConfigurationId, undefined, undefined, { auth_session: auth_session }));

					return { authorization_code: res.data.authorization_code, state: state };
				}
				else {
					console.error(err);
					throw new Error("First party app authorization failed");
				}
			}
		}
		catch (err) {

		}

		throw new Error("First party app authorization failed");

	}
}
