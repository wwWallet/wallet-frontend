import { useCallback, useRef, useMemo } from 'react';
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
		"dpop-nonce"?: string;
	};
};

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

	const tokenEndpointURL = useRef<string | null>(null);
	const grantType = useRef<GrantType>(GrantType.AUTHORIZATION_CODE);
	const refreshToken = useRef<string | null>(null);
	const authorizationCode = useRef<string | null>(null);
	const codeVerifier = useRef<string | null>(null);
	const redirectUri = useRef<string | null>(null);
	const clientId = useRef<string | null>(null);

	const httpHeaders = useMemo(() => ({
		'Content-Type': 'application/x-www-form-urlencoded',
	}), []);

	const setClientId = useCallback((clientIdValue: string) => {
		clientId.current = clientIdValue;
	}, []);

	const setGrantType = useCallback((grant: GrantType) => {
		grantType.current = grant;
	}, []);

	const setAuthorizationCode = useCallback((authzCode: string) => {
		authorizationCode.current = authzCode;
	}, []);

	const setCodeVerifier = useCallback((codeVerifierValue: string) => {
		codeVerifier.current = codeVerifierValue;
	}, []);

	const setRefreshToken = useCallback((token: string) => {
		refreshToken.current = token;
	}, []);

	const setRedirectUri = useCallback((uri: string) => {
		redirectUri.current = uri;
	}, []);

	const setTokenEndpoint = useCallback((endpoint: string) => {
		tokenEndpointURL.current = endpoint;
	}, []);

	const setDpopHeader = useCallback(async (
		dpopPrivateKey: KeyLike,
		dpopPublicKeyJwk: JWK,
		jti: string
	) => {
		if (!tokenEndpointURL.current) {
			throw new Error("tokenEndpointURL was not defined");
		}
		const dpop = await generateDPoP(
			dpopPrivateKey,
			dpopPublicKeyJwk,
			jti,
			"POST",
			tokenEndpointURL.current,
			httpHeaders['dpop-nonce']
		);

		httpHeaders['DPoP'] = dpop;
	}, [httpHeaders]);

	const execute = useCallback(async (): Promise<
		{ response: AccessToken } | { error: TokenRequestError; response?: any }
	> => {
		const formData = new URLSearchParams();

		if (!clientId.current || !redirectUri.current) {
			throw new Error("Client ID or Redirect URI is not set");
		}

		formData.append('client_id', clientId.current);

		if (grantType.current === GrantType.AUTHORIZATION_CODE) {
			if (!authorizationCode.current || !codeVerifier.current) {
				throw new Error("Authorization Code or Code Verifier is not set");
			}

			formData.append('grant_type', 'authorization_code');
			formData.append('code', authorizationCode.current);
			formData.append('code_verifier', codeVerifier.current);
		} else if (grantType.current === GrantType.REFRESH) {
			if (!refreshToken.current) {
				throw new Error("Refresh Token is not set");
			}

			formData.append('grant_type', 'refresh_token');
			formData.append('refresh_token', refreshToken.current);
		} else {
			throw new Error("Invalid grant type selected");
		}

		formData.append('redirect_uri', redirectUri.current);

		const response = await httpProxy.post(
			tokenEndpointURL.current!,
			formData.toString(),
			httpHeaders
		);

		if (response.status !== 200) {

			console.error("Failed token request");

			if (response.headers?.['dpop-nonce']) {
				httpHeaders['dpop-nonce'] = response.headers['dpop-nonce'];
				return execute();
			}

			if (response?.data?.["error"] === "authorization_required") {
				return { error: TokenRequestError.AUTHORIZATION_REQUIRED, response: response?.data };
			}

			return { error: TokenRequestError.FAILED };
		}

		return {
			response: {
				access_token: response.data?.["access_token"],
				c_nonce: response.data?.["c_nonce"],
				c_nonce_expires_in: response.data?.["c_nonce_expires_in"],
				expires_in: response.data?.["expires_in"],
				refresh_token: response.data?.["refresh_token"],
				httpResponseHeaders: {
					...response.headers,
				},
			},
		};
	}, [httpProxy, httpHeaders]);

	return useMemo(() => ({
		setClientId,
		setGrantType,
		setAuthorizationCode,
		setCodeVerifier,
		setRefreshToken,
		setRedirectUri,
		setTokenEndpoint,
		setDpopHeader,
		execute,
	}), [
		setClientId,
		setGrantType,
		setAuthorizationCode,
		setCodeVerifier,
		setRefreshToken,
		setRedirectUri,
		setTokenEndpoint,
		setDpopHeader,
		execute,
	]);
}
