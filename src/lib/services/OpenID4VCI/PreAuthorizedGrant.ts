import * as oauth4webapi from 'oauth4webapi';
import { GrantType } from './OAuth/TokenRequest';
export namespace PreAuthorizedGrant {
	export const preAuthorizedCodeGrantRequest = async (
		as: oauth4webapi.AuthorizationServer,
		client: oauth4webapi.Client,
		clientAuth: oauth4webapi.ClientAuth,
		credentialOfferParams: { preAuthorizedCode: string; txCode?: string },
		options?: oauth4webapi.TokenEndpointRequestOptions,
	): Promise<Response> => {
		const parameters = new URLSearchParams({
			'pre-authorized_code': credentialOfferParams.preAuthorizedCode,
		});
		if (credentialOfferParams.txCode) {
			parameters.set('tx_code', credentialOfferParams.txCode);
		}
		return oauth4webapi.genericTokenEndpointRequest(
			as,
			client,
			clientAuth,
			GrantType.PRE_AUTHORIZED_CODE,
			parameters,
			options,
		);
	};

	export const processPreAuthorizedCodeTokenResponse = async (
		as: oauth4webapi.AuthorizationServer,
		client: oauth4webapi.Client,
		response: Response,
	): Promise<oauth4webapi.TokenEndpointResponse> => {
		return oauth4webapi.processGenericTokenEndpointResponse(as, client, response);
	};
}
