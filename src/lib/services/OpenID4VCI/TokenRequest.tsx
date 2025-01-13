import { JWK, KeyLike } from 'jose';
import { useHttpProxy } from '../HttpProxy/HttpProxy';
import { generateDPoP } from '../../utils/dpop';

export type AccessToken = {
	access_token: string;
	c_nonce: string;
	expires_in: number;
	c_nonce_expires_in: number;
	refresh_token?: string;

	httpResponseHeaders: {
		"dpop-nonce"?: string
	}
}

export enum GrantType {
	AUTHORIZATION_CODE = "code",
	REFRESH = "refresh_token",
}


export enum TokenRequestError {
	FAILED,
	AUTHORIZATION_REQUIRED,
}

export function useTokenRequest() {

	const httpProxy = useHttpProxy();

	let tokenEndpointURL = null;

	let grant_type: GrantType = GrantType.AUTHORIZATION_CODE;
	let refresh_token = null;
	let code = null;
	let code_verifier = null;
	let redirect_uri = null;
	let client_id = null;

	const httpHeaders = {
		'Content-Type': 'application/x-www-form-urlencoded',
	};

	function setClientId(clientId: string) {
		client_id = clientId;
	}

	function setGrantType(grant: GrantType) {
		grant_type = grant;
	}

	function setAuthorizationCode(authzCode: string) {
		code = authzCode;
	}

	function setCodeVerifier(codeVerifier: string) {
		code_verifier = codeVerifier;
	}

	function setRefreshToken(tok: string) {
		refresh_token = tok;
	}

	function setRedirectUri(redirectUri: string) {
		redirect_uri = redirectUri;
	}

	function setTokenEndpoint(tokenEndpoint: string) {
		tokenEndpointURL = tokenEndpoint;
	}

	async function setDpopHeader(dpopPrivateKey: KeyLike, dpopPublicKeyJwk: JWK, jti: string) {
		if (!tokenEndpointURL) {
			throw new Error("tokenEndpointURL was not defined");
		}
		const dpop = await generateDPoP(
			dpopPrivateKey as KeyLike,
			dpopPublicKeyJwk,
			jti,
			"POST",
			tokenEndpointURL,
			httpHeaders['dpop-nonce']
		);

		httpHeaders['DPoP'] = dpop;
	}


	async function execute(): Promise<{ response: AccessToken } | { error: TokenRequestError, response?: any }> {
		const formData = new URLSearchParams();

		formData.append('client_id', client_id);
		if (grant_type == GrantType.AUTHORIZATION_CODE) {
			console.log("Executing authorization code grant...");

			formData.append('grant_type', 'authorization_code');
			formData.append('code', code);
			formData.append('code_verifier', code_verifier);
		}
		else if (grant_type == GrantType.REFRESH) {
			console.log("Executing refresh token grant...");
			if (!refresh_token) {
				console.info("Found no refresh_token to execute refesh_token grant")
				throw new Error("Found no refresh_token to execute refesh_token grant");
			}
			formData.append('grant_type', 'refresh_token');
			formData.append('refresh_token', refresh_token);
		}
		else {
			throw new Error("No grant type selected in requestCredentials()");
		}
		formData.append('redirect_uri', redirect_uri);

		const response = await httpProxy.post(tokenEndpointURL, formData.toString(), httpHeaders);

		if (response.err) {
			const { err } = response;
			console.log("failed token request")
			console.log(JSON.stringify(err));
			console.log("Dpop nonce found = ", err.headers['dpop-nonce'])
			if (err.headers['dpop-nonce']) {
				httpHeaders['dpop-nonce'] = err.headers['dpop-nonce'];
				if (httpHeaders['dpop-nonce']) {
					return execute();
				}
			}
			else if (err.data.error == "authorization_required") {
				return { error: TokenRequestError.AUTHORIZATION_REQUIRED, response: err.data };
			}
			else if (err.data.error) {
				console.error("OID4VCI Token Response Error: ", JSON.stringify(err.data))
			}
			return { error: TokenRequestError.FAILED };
		}

		return {
				response: {
				access_token: response.data.access_token,
				c_nonce: response.data.c_nonce,
				c_nonce_expires_in: response.data.c_nonce_expires_in,
				expires_in: response.data.expires_in,
				refresh_token: response.data?.refresh_token,
				httpResponseHeaders: {
					...response.headers
				}
			}
		}
	}

	return {
		setClientId,
		setGrantType,
		setAuthorizationCode,
		setCodeVerifier,
		setRefreshToken,
		setRedirectUri,
		setTokenEndpoint,
		setDpopHeader,

		execute,
	}
}
