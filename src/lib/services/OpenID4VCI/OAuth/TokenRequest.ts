import { useCallback, useRef, useMemo } from 'react';
import { JWK, KeyLike } from 'jose';
import { useHttpProxy } from '../../HttpProxy/HttpProxy';
import * as oauth4webapi from 'oauth4webapi';
import { PreAuthorizedGrant } from '../PreAuthorizedGrant';
import { MODE, OPENID4VCI_REDIRECT_URI } from '@/config';

const { customFetch, allowInsecureRequests } = oauth4webapi;
const isDev = MODE === 'development';

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
	PRE_AUTHORIZED_CODE = "urn:ietf:params:oauth:grant-type:pre-authorized_code",
}

export enum TokenRequestError {
	FAILED,
	AUTHORIZATION_REQUIRED,
}

export function useTokenRequest() {
	const httpProxy = useHttpProxy();

	const tokenEndpointURL = useRef<string | null>(null);
	const issuer = useRef<string | null>(null);
	const grantType = useRef<GrantType>(GrantType.AUTHORIZATION_CODE);
	const refreshToken = useRef<string | null>(null);
	const authorizationCode = useRef<string | null>(null);
	const preAuthorizedCode = useRef<string | null>(null);
	const txCode = useRef<string | null>(null);
	const authorizationResponseUrl = useRef<string | null>(null);
	const oauthState = useRef<string | null>(null);
	const codeVerifier = useRef<string | null>(null);
	const redirectUri = useRef<string | null>(null);
	const clientId = useRef<string | null>(OPENID4VCI_REDIRECT_URI);
	const retries = useRef<number>(0);
	const dpopParams = useRef<{ dpopPrivateKey: KeyLike, dpopPublicKeyJwk: JWK } | null>(null);
	const dpopHandle = useRef<oauth4webapi.DPoPHandle | null>(null);

	function normalizeHeaders(h: any): Record<string, string> {
		const out: Record<string, string> = {};
		if (!h) return out;
		if (h instanceof Headers) {
			h.forEach((v, k) => {
				out[k.toLowerCase()] = v;
			});
			return out;
		}
		for (const [k, v] of Object.entries(h)) {
			if (v === undefined || v === null) continue;
			out[k.toLowerCase()] = Array.isArray(v) ? v.join(', ') : String(v);
		}
		return out;
	}

	const myCustomFetch = useMemo(() => {
		return async (url: string, options?: RequestInit) => {
			const method = (options?.method ?? 'POST').toLowerCase();
			const headers = normalizeHeaders(options?.headers);
			const body = options?.body;

			let data: string | undefined;
			if (typeof body === 'string') {
				data = body;
			} else if (body instanceof URLSearchParams) {
				data = body.toString();
			} else if (body != null) {
				data = String(body);
			}

			let wrapped;
			if (method === 'post') {
				wrapped = await httpProxy.post(url, data, headers);
			} else {
				throw new Error(`Unsupported method in customFetch: ${method}`);
			}

			const resHeaders = normalizeHeaders(wrapped.headers);
			const contentType = resHeaders['content-type'] ?? 'application/json';
			let bodyText: string;
			if (typeof wrapped.data === 'string') {
				bodyText = wrapped.data;
			} else if (contentType.includes('application/json')) {
				bodyText = JSON.stringify(wrapped.data);
			} else {
				bodyText = String(wrapped.data ?? '');
			}

			return new Response(bodyText, {
				status: wrapped.status ?? 500,
				headers: resHeaders,
			});
		};
	}, [httpProxy]);

	const setClientId = useCallback((clientIdValue: string) => {
		clientId.current = clientIdValue;
	}, []);

	const setIssuer = useCallback((issuerValue: string) => {
		issuer.current = issuerValue;
	}, []);

	const setGrantType = useCallback((grant: GrantType) => {
		grantType.current = grant;
	}, []);

	const setAuthorizationCode = useCallback((authzCode: string) => {
		authorizationCode.current = authzCode;
	}, []);

	const setPreAuthorizedCode = useCallback((c: string) => {
		preAuthorizedCode.current = c;
	}, []);

	const setTxCode = useCallback((c: string) => {
		txCode.current = c;
	}, []);

	const setAuthorizationResponseUrl = useCallback((url: string) => {
		authorizationResponseUrl.current = url;
	}, []);

	const setState = useCallback((state: string) => {
		oauthState.current = state;
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

	const setDpopHeader = useCallback(async (dpopPrivateKey: KeyLike, dpopPublicKeyJwk: JWK, _jti: string) => {
		dpopParams.current = { dpopPrivateKey, dpopPublicKeyJwk };
		dpopHandle.current = null;
	}, []);

	const getDPoPHandle = useCallback(async (client: oauth4webapi.Client) => {
		if (!dpopParams.current) {
			return undefined;
		}
		if (dpopHandle.current) {
			return dpopHandle.current;
		}
		const publicKey = await crypto.subtle.importKey(
			'jwk',
			dpopParams.current.dpopPublicKeyJwk as JsonWebKey,
			{ name: 'ECDSA', namedCurve: 'P-256' },
			true,
			['verify']
		);
		const keyPair = {
			privateKey: dpopParams.current.dpopPrivateKey as CryptoKey,
			publicKey: publicKey as CryptoKey,
		};
		dpopHandle.current = oauth4webapi.DPoP(client, keyPair);
		return dpopHandle.current;
	}, []);

	const execute = useCallback(async (): Promise<
		{ response: AccessToken } | { error: TokenRequestError; response?: any }
	> => {
		retries.current = 0;

		if (!tokenEndpointURL.current) {
			throw new Error("Token endpoint is not set");
		}

		const as: oauth4webapi.AuthorizationServer = {
			issuer: issuer.current ?? tokenEndpointURL.current,
			token_endpoint: tokenEndpointURL.current,
		};

		const client: oauth4webapi.Client | null = clientId.current ? { client_id: clientId.current } : null;
		const clientAuth = oauth4webapi.None();
		const DPoP = client ? await getDPoPHandle(client) : null;

		const options: oauth4webapi.TokenEndpointRequestOptions = {
			[customFetch]: myCustomFetch,
			[allowInsecureRequests]: isDev,
			...(DPoP ? { DPoP } : {}),
		};

		const preAuthorizedCodeGrantRequest = async () => {
			if (!preAuthorizedCode.current) {
				throw new Error("Pre-Authorized Code not set");
			}
			return PreAuthorizedGrant.preAuthorizedCodeGrantRequest(
				as,
				{ preAuthorizedCode: preAuthorizedCode.current, txCode: txCode.current },
				{ dpopPrivateKey: dpopParams.current.dpopPrivateKey, dpopPublicKeyJwk: dpopParams.current.dpopPublicKeyJwk },
				options
			);
		}

		const authorizationCodeGrantRequest = async () => {
			if (!clientId.current || !redirectUri.current) {
				throw new Error("Client ID or Redirect URI is not set");
			}
			if (!authorizationCode.current || !codeVerifier.current) {
				throw new Error("Authorization Code or Code Verifier is not set");
			}
			let callbackParams: URLSearchParams;
			if (authorizationResponseUrl.current) {
				const currentUrl = new URL(authorizationResponseUrl.current);
				callbackParams = oauth4webapi.validateAuthResponse(
					as,
					client,
					currentUrl,
					oauthState.current ?? undefined
				);
			} else {
				callbackParams = new URLSearchParams({ code: authorizationCode.current });
			}
			return oauth4webapi.authorizationCodeGrantRequest(
				as,
				client,
				clientAuth,
				callbackParams,
				redirectUri.current!,
				codeVerifier.current,
				options
			);
		};

		const refreshTokenGrantRequest = async () => {
			if (!refreshToken.current) {
				throw new Error("Refresh Token is not set");
			}
			return oauth4webapi.refreshTokenGrantRequest(
				as,
				client,
				clientAuth,
				refreshToken.current,
				options
			);
		};

		let tokenRequest:
			| typeof authorizationCodeGrantRequest
			| typeof refreshTokenGrantRequest
			| typeof preAuthorizedCodeGrantRequest
			| null;

		if (grantType.current === GrantType.AUTHORIZATION_CODE) {
			tokenRequest = authorizationCodeGrantRequest;
		} else if (grantType.current === GrantType.REFRESH) {
			tokenRequest = refreshTokenGrantRequest;
		} else if (grantType.current === GrantType.PRE_AUTHORIZED_CODE) {
			tokenRequest = preAuthorizedCodeGrantRequest;
		}

		if (!tokenRequest) {
			throw new Error("Invalid grant type selected");
		}

		const processResponse = async (response: Response) => {
			if (grantType.current === GrantType.AUTHORIZATION_CODE) {
				return oauth4webapi.processAuthorizationCodeResponse(as, client, response);
			} else if (grantType.current === GrantType.REFRESH) {
				return oauth4webapi.processRefreshTokenResponse(as, client, response);
			} else if (grantType.current === GrantType.PRE_AUTHORIZED_CODE) {
				return PreAuthorizedGrant.processPreAuthorizedCodeTokenResponse(as, client, response);
			}
		};

		const normalizeError = (err: any) => {
			if (err && typeof err === 'object' && 'error' in err) {
				if (err.error === "authorization_required") {
					return { error: TokenRequestError.AUTHORIZATION_REQUIRED, response: err };
				}
				return { error: TokenRequestError.FAILED, response: err };
			}
			return null;
		};

		let response = await tokenRequest();
		let result: any;
		try {
			result = await processResponse(response);
		} catch (err) {
			if (oauth4webapi.isDPoPNonceError(err) && retries.current < 1) {
				retries.current += 1;
				response = await tokenRequest();
				result = await processResponse(response);
			} else {
				const normalized = normalizeError(err);
				if (normalized) return normalized;
				throw err;
			}
		}

		if (result && typeof result === 'object' && 'error' in result) {
			if (result.error === "authorization_required") {
				return { error: TokenRequestError.AUTHORIZATION_REQUIRED, response: result };
			}
			return { error: TokenRequestError.FAILED, response: result };
		}

		return {
			response: {
				access_token: result?.access_token,
				c_nonce: result?.c_nonce,
				c_nonce_expires_in: result?.c_nonce_expires_in,
				expires_in: result?.expires_in,
				refresh_token: result?.refresh_token,
				httpResponseHeaders: {
					...normalizeHeaders(response.headers),
				},
			},
		};
	}, [getDPoPHandle, myCustomFetch]);

	return useMemo(() => ({
		setClientId,
		setIssuer,
		setGrantType,
		setAuthorizationCode,
		setPreAuthorizedCode,
		setTxCode,
		setAuthorizationResponseUrl,
		setState,
		setCodeVerifier,
		setRefreshToken,
		setRedirectUri,
		setTokenEndpoint,
		setDpopHeader,
		execute,
	}), [
		setClientId,
		setIssuer,
		setGrantType,
		setAuthorizationCode,
		setPreAuthorizedCode,
		setTxCode,
		setAuthorizationResponseUrl,
		setState,
		setCodeVerifier,
		setRefreshToken,
		setRedirectUri,
		setTokenEndpoint,
		setDpopHeader,
		execute,
	]);
}
