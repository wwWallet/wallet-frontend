import { IOpenID4VCIAuthorizationRequest } from "../../../interfaces/IOpenID4VCIAuthorizationRequest";
import { OpenidAuthorizationServerMetadata } from "../../../schemas/OpenidAuthorizationServerMetadataSchema";
import pkce from 'pkce-challenge';
import { OpenidCredentialIssuerMetadata } from "../../../schemas/OpenidCredentialIssuerMetadataSchema";
import { generateRandomIdentifier } from "../../../utils/generateRandomIdentifier";
import { OpenID4VCIClientState } from "../../../types/OpenID4VCIClientState";
import { useOpenID4VCIClientStateRepository } from "../../OpenID4VCIClientStateRepository";
import { useHttpProxy } from "../../HttpProxy/HttpProxy";
import { useCallback, useMemo, useContext } from "react";
import OpenID4VPContext from "../../../../context/OpenID4VPContext";
import SessionContext from "../../../../context/SessionContext";

export function useOpenID4VCIAuthorizationRequestForFirstPartyApplications(): IOpenID4VCIAuthorizationRequest {
	const httpProxy = useHttpProxy();
	const openID4VCIClientStateRepository = useOpenID4VCIClientStateRepository();

	const { openID4VP } = useContext(OpenID4VPContext);
	const { keystore } = useContext(SessionContext);

	const generate = useCallback(
		async (
			credentialConfigurationId: string,
			issuer_state: string | undefined,
			config: {
				credentialIssuerIdentifier: string;
				redirectUri: string;
				clientId: string;
				authorizationServerMetadata: OpenidAuthorizationServerMetadata;
				credentialIssuerMetadata: OpenidCredentialIssuerMetadata;
			}
		): Promise<{ authorizationRequestURL: string } | { authorization_code: string; state: string }> => {
			const userHandleB64u = keystore.getUserHandleB64u();
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
				res = await httpProxy.post(config.authorizationServerMetadata.authorization_challenge_endpoint, formData.toString(), {
					'Content-Type': 'application/x-www-form-urlencoded'
				});
				console.log("Res = ", res)
				const err = res.err;
				if (err) {
					if (err?.data && err?.data?.error === "insufficient_authorization") { // Authorization Error Response
						const { auth_session, presentation } = err?.data;

						// this function should prompt the user for presentation selection
						const result = await openID4VP.handleAuthorizationRequest("openid4vp:" + presentation).then((res) => {
							if ('err' in res) {
								return;
							}

							const jsonedMap = Object.fromEntries(res.conformantCredentialsMap);
							return openID4VP.promptForCredentialSelection(jsonedMap, config.credentialIssuerMetadata.credential_issuer);
						}).then((selectionMap) => {
							return openID4VP.sendAuthorizationResponse(selectionMap);
						});

						if (!('presentation_during_issuance_session' in result)) {
							throw new Error("presentation_during_issuance_session is not present in the result of the presentation sending phase");
						}
						const presentation_during_issuance_session = result.presentation_during_issuance_session;
						// add auth_session and presentation_during_issuance_session params on authorization_challenge_endpoint POST request
						formData.append("auth_session", auth_session);
						formData.append("presentation_during_issuance_session", presentation_during_issuance_session);
						res = await httpProxy.post(config.authorizationServerMetadata.authorization_challenge_endpoint, formData.toString(), {
							'Content-Type': 'application/x-www-form-urlencoded'
						});

						if (!res.data.authorization_code) {
							throw new Error("authorization_code not present on the authorization response");
						}
						await openID4VCIClientStateRepository.create(new OpenID4VCIClientState(userHandleB64u, config.credentialIssuerIdentifier, state, code_verifier, credentialConfigurationId, undefined, undefined, { auth_session: auth_session }));

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
		},
		[httpProxy, keystore, openID4VCIClientStateRepository, openID4VP]
	);

	return useMemo(() => ({ generate }), [generate]);
}
