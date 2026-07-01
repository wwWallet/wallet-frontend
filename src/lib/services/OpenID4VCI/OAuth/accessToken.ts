import * as jose from 'jose';
import { generateRandomIdentifier } from '@/lib/utils/generateRandomIdentifier';
import { GrantType, TokenRequestBuilder } from './TokenRequest';

export type OAuthTokenState = {
	access_token: string;
	expiration_timestamp: number;
	c_nonce?: string;
	c_nonce_expiration_timestamp?: number;
	refresh_token?: string;
};

export type DpopState = {
	dpopJti: string;
	dpopPrivateKeyJwk: jose.JWK;
	dpopPublicKeyJwk?: jose.JWK;
	dpopAlg: string;
};

export type OAuthTokenRefreshRequest = {
	tokenEndpoint: string;
	issuer: string;
	clientId: string | null;
	refreshToken: string;
	additionalParameters?: Record<string, string>;
	dpop?: DpopState;
	dpopSupported?: boolean;
};

export type OAuthTokenRefreshResult = {
	tokenState: OAuthTokenState;
	headers: Record<string, string>;
	dpop?: DpopState;
};

export function accessTokenIsValid(
	tokenState: { expiration_timestamp?: number } | null | undefined,
	now: number,
	refreshSkewSeconds: number,
): boolean {
	const expiresAt = tokenState?.expiration_timestamp;
	return typeof expiresAt !== 'number' || (now < expiresAt && expiresAt - now > refreshSkewSeconds);
}

export async function refreshAccessToken(
	request: OAuthTokenRefreshRequest,
	context: {
		tokenRequestBuilder: TokenRequestBuilder;
		now?: number;
	},
): Promise<OAuthTokenRefreshResult> {
	let dpop = request.dpop;
	let dpopPrivateKey: jose.KeyLike | Uint8Array | null = null;
	let dpopPrivateKeyJwk: jose.JWK | null = null;
	let dpopPublicKeyJwk: jose.JWK | null = null;
	const jti = generateRandomIdentifier(8);

	if (request.dpopSupported) {
		if (dpop) {
			dpopPrivateKeyJwk = dpop.dpopPrivateKeyJwk;
			dpopPublicKeyJwk = dpop.dpopPublicKeyJwk;
			[dpopPrivateKey] = await Promise.all([
				jose.importJWK(dpop.dpopPrivateKeyJwk, dpop.dpopAlg),
			]);
		} else {
			const { privateKey, publicKey } = await jose.generateKeyPair('ES256', { extractable: true });
			[dpopPrivateKeyJwk, dpopPublicKeyJwk] = await Promise.all([
				jose.exportJWK(privateKey),
				jose.exportJWK(publicKey),
			]);
			dpopPrivateKey = privateKey;
		}

		await context.tokenRequestBuilder.setDpopHeader(dpopPrivateKey as jose.KeyLike, dpopPublicKeyJwk as jose.JWK, jti);
		dpop = {
			dpopAlg: 'ES256',
			dpopJti: jti,
			dpopPrivateKeyJwk: dpopPrivateKeyJwk as jose.JWK,
			dpopPublicKeyJwk: dpopPublicKeyJwk as jose.JWK,
		};
	}

	context.tokenRequestBuilder.setTokenEndpoint(request.tokenEndpoint);
	context.tokenRequestBuilder.setIssuer(request.issuer);
	context.tokenRequestBuilder.setGrantType(GrantType.REFRESH);
	context.tokenRequestBuilder.setRefreshToken(request.refreshToken);
	context.tokenRequestBuilder.setClientId(request.clientId);
	context.tokenRequestBuilder.setAdditionalParameters(request.additionalParameters ?? null);

	const result = await context.tokenRequestBuilder.execute();
	if ('error' in result) {
		throw new Error("Token refresh failed");
	}

	const { access_token, c_nonce, expires_in, c_nonce_expires_in, refresh_token } = result.response;
	if (!access_token) {
		throw new Error("Missing access_token from refresh response");
	}

	const now = context.now ?? Math.floor(Date.now() / 1000);
	return {
		tokenState: {
			access_token,
			c_nonce,
			expiration_timestamp: now + expires_in,
			c_nonce_expiration_timestamp: now + c_nonce_expires_in,
			refresh_token: refresh_token ?? request.refreshToken,
		},
		headers: { ...result.response.httpResponseHeaders },
		dpop,
	};
}
