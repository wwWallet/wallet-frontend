import { IOpenID4VCIAuthorizationRequest } from "../../../interfaces/IOpenID4VCIAuthorizationRequest";
import { OpenidAuthorizationServerMetadata } from "../../../schemas/OpenidAuthorizationServerMetadataSchema";
import pkce from 'pkce-challenge';
import { OpenidCredentialIssuerMetadata } from "../../../schemas/OpenidCredentialIssuerMetadataSchema";
import { generateRandomIdentifier } from "../../../utils/generateRandomIdentifier";
import { OpenID4VCIClientState } from "../../../types/OpenID4VCIClientState";
import { useHttpProxy } from "../../HttpProxy/HttpProxy";
import { useOpenID4VCIClientStateRepository } from "../../OpenID4VCIClientStateRepository";
import { useCallback, useMemo, useContext } from "react";
import SessionContext from "@/context/SessionContext";

export function useOpenID4VCIAuthorizationRequest(): IOpenID4VCIAuthorizationRequest {

	const httpProxy = useHttpProxy();
	const openID4VCIClientStateRepository = useOpenID4VCIClientStateRepository();
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
		): Promise<{ authorizationRequestURL: string }> => {
			const userHandleB64u = keystore.getUserHandleB64u();

			const { code_challenge, code_verifier } = await pkce();

			const authorizationURLParams = new URLSearchParams();

			const selectedCredentialConfigurationSupported = config.credentialIssuerMetadata.credential_configurations_supported[credentialConfigurationId];
			authorizationURLParams.append("scope", selectedCredentialConfigurationSupported.scope);
			authorizationURLParams.append("response_type", "code");
			authorizationURLParams.append("client_id", config.clientId);
			authorizationURLParams.append("code_challenge", code_challenge);
			authorizationURLParams.append("code_challenge_method", "S256");

			// the purpose of the "id" is to provide the "state" a random factor for unlinkability and to make OpenID4VCIClientState instances unique
			const state = btoa(JSON.stringify({ userHandleB64u: userHandleB64u, id: generateRandomIdentifier(12) })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
			authorizationURLParams.append("state", state);

			if (issuer_state) {
				authorizationURLParams.append("issuer_state", issuer_state);
			}

			authorizationURLParams.append("redirect_uri", config.redirectUri);
			const authorizationRequestURL = new URL(config.authorizationServerMetadata.authorization_endpoint);
			authorizationRequestURL.search = authorizationURLParams.toString();
			await openID4VCIClientStateRepository.create(new OpenID4VCIClientState(userHandleB64u, config.credentialIssuerIdentifier, state, code_verifier, credentialConfigurationId))

			return { authorizationRequestURL: authorizationRequestURL.toString() };
		},
		[httpProxy, openID4VCIClientStateRepository, keystore]
	);

	return useMemo(() => ({ generate }), [generate]);
}
