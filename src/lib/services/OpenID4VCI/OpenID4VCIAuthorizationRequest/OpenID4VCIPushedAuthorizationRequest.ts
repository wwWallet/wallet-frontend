import { IOpenID4VCIAuthorizationRequest } from "../../../interfaces/IOpenID4VCIAuthorizationRequest";
import { OpenidAuthorizationServerMetadata } from "wallet-common";
import pkce from 'pkce-challenge';
import { OpenidCredentialIssuerMetadata } from "../../../schemas/OpenidCredentialIssuerMetadataSchema";
import { generateRandomIdentifier } from "../../../utils/generateRandomIdentifier";
import { useHttpProxy } from "../../HttpProxy/HttpProxy";
import { useCallback, useMemo, useContext } from "react";
import SessionContext from "@/context/SessionContext";
import { IOpenID4VCIClientStateRepository } from "@/lib/interfaces/IOpenID4VCIClientStateRepository";
import { WalletStateUtils } from "@/services/WalletStateUtils";


export function useOpenID4VCIPushedAuthorizationRequest(openID4VCIClientStateRepository: IOpenID4VCIClientStateRepository): IOpenID4VCIAuthorizationRequest {

	const httpProxy = useHttpProxy();
	const { keystore, api, isLoggedIn } = useContext(SessionContext);

	const { get } = api;
	const getRememberIssuerAge = useCallback(async (): Promise<number | null> => {
		if (!api || !isLoggedIn) {
			return null;
		}
		return get('/user/session/account-info').then((response) => {
			const userData = response.data;
			return userData.settings.openidRefreshTokenMaxAgeInSeconds as number;
		});
	}, [get, isLoggedIn]);

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

			const formData = new URLSearchParams();

			const selectedCredentialConfigurationSupported = config.credentialIssuerMetadata.credential_configurations_supported[credentialConfigurationId];
			formData.append("scope", selectedCredentialConfigurationSupported.scope);

			formData.append("response_type", "code");

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
				res = await httpProxy.post(config.authorizationServerMetadata.pushed_authorization_request_endpoint, formData.toString(), {
					'Content-Type': 'application/x-www-form-urlencoded'
				});
			}
			catch (err) {
				if (err?.response?.data) {
					throw new Error("Pushed authorization request failed ", err.response.data)
				}
				else {
					console.error(err);
					throw new Error("Pushed authorization request failed")
				}
			}

			if (!res.data.request_uri) {
				throw new Error("Pushed Authorization request failed. Reason: " + JSON.stringify(res.data))
			}
			const { request_uri } = res.data;
			const authorizationRequestURL = new URL(config.authorizationServerMetadata.authorization_endpoint);
			authorizationRequestURL.searchParams.set('request_uri', request_uri);
			authorizationRequestURL.searchParams.set('client_id', config.clientId);
			const age = await getRememberIssuerAge();
			if (age != null && age == 0) {
				authorizationRequestURL.searchParams.set('prompt', 'login');
			}

			await openID4VCIClientStateRepository.create({
				sessionId: WalletStateUtils.getRandomUint32(),
				credentialIssuerIdentifier: config.credentialIssuerIdentifier,
				state,
				code_verifier,
				credentialConfigurationId,
				created: Math.floor(Date.now() / 1000),
			});
			await openID4VCIClientStateRepository.commitStateChanges();
			return { authorizationRequestURL: authorizationRequestURL.toString() };
		},
		[httpProxy, openID4VCIClientStateRepository, keystore, openID4VCIClientStateRepository]
	);

	return useMemo(() => ({ generate }), [generate]);
}
