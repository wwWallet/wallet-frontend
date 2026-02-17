import * as oauth4webapi from "oauth4webapi";
import { GrantType } from "./OAuth/TokenRequest";
import { generateDPoP } from "@/lib/utils/dpop";
import { JWK, KeyLike } from "jose";

export namespace PreAuthorizedGrant {
	export const preAuthorizedCodeGrantRequest = async (
		as: oauth4webapi.AuthorizationServer,
		credentialOfferParams: { preAuthorizedCode: string, txCode?: string },
		dpop: { dpopPrivateKey: KeyLike, dpopPublicKeyJwk: JWK },
		options?: oauth4webapi.TokenEndpointRequestOptions
	): Promise<Response> => {

		const customFetchFn = options[oauth4webapi.customFetch];
		const tokenRequestParams = new URLSearchParams();
		tokenRequestParams.set("pre-authorized_code", credentialOfferParams.preAuthorizedCode);
		tokenRequestParams.set("grant_type", GrantType.PRE_AUTHORIZED_CODE);
		if (credentialOfferParams.txCode) {
			tokenRequestParams.set("tx_code", credentialOfferParams.txCode);
		}

		const requestOpts: oauth4webapi.CustomFetchOptions<"POST", URLSearchParams> = {
			body: tokenRequestParams,
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"DPoP": await generateDPoP(
					dpop.dpopPrivateKey,
					dpop.dpopPublicKeyJwk,
					"POST",
					as.token_endpoint,
				),
			},
			redirect: "manual",
		};
		return customFetchFn(as.token_endpoint, requestOpts);
	}

	export const processPreAuthorizedCodeTokenResponse = async (
		as: oauth4webapi.AuthorizationServer,
		client: oauth4webapi.Client,
		response: Response
	): Promise<oauth4webapi.TokenEndpointResponse> => {
		return oauth4webapi.processAuthorizationCodeResponse(as, client, response);
	}
}
