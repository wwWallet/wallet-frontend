import * as jose from 'jose';
import { generateRandomIdentifier } from '@/lib/utils/generateRandomIdentifier';
import type { useWalletProvider } from '../../WalletProvider';
import { GrantType, TokenRequestBuilder } from './TokenRequest';

export type OAuthTokenState = {
	access_token: string;
	expiration_timestamp: number;
	c_nonce: string;
	c_nonce_expiration_timestamp: number;
	refresh_token?: string;
};

export type DpopState = {
	dpopJti: string;
	dpopPrivateKeyJwk: jose.JWK;
	dpopPublicKeyJwk?: jose.JWK;
	dpopAlg: string;
};

export type RequestWalletInstanceAttestation = ReturnType<typeof useWalletProvider>['requestWalletInstanceAttestation'];

export async function requestTokenWalletInstanceAttestation(
	requestWia: RequestWalletInstanceAttestation,
	publicJwk: jose.JWK | null | undefined,
	clientId: string | null,
	issuer: string,
): Promise<string> {
	if (!publicJwk || !clientId) {
		throw new Error('Wallet Instance Attestation requires the session public key and client ID');
	}
	const response = await requestWia({ ...publicJwk, key_ops: ['verify'] }, clientId, issuer);
	if (!response) {
		throw new Error('Failed to get Wallet Instance Attestation from wallet-backend-server');
	}
	return response.wallet_instance_attestation;
}

export type OAuthTokenRefreshRequest = {
	tokenEndpoint: string;
	issuer: string;
	clientId: string | null;
	refreshToken: string;
	attestationRequired?: boolean;
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
		requestWalletInstanceAttestation?: RequestWalletInstanceAttestation;
	},
): Promise<OAuthTokenRefreshResult> {
	let dpop = request.dpop;
	let dpopPrivateKey: jose.KeyLike | null = null;
	let dpopPrivateKeyJwk: jose.JWK | null = null;
	let dpopPublicKeyJwk: jose.JWK | null = null;
	const jti = generateRandomIdentifier(8);

	if (request.attestationRequired && !dpop) {
		throw new Error('Wallet Instance Attestation is missing its bound key');
	}

	if (request.dpopSupported || request.attestationRequired) {
		if (dpop) {
			dpopPrivateKeyJwk = dpop.dpopPrivateKeyJwk;
			dpopPublicKeyJwk = dpop.dpopPublicKeyJwk ?? null;
			const importedPrivateKey = await jose.importJWK(dpop.dpopPrivateKeyJwk, dpop.dpopAlg);
			if (importedPrivateKey instanceof Uint8Array) {
				throw new Error("DPoP private key must be asymmetric");
			}
			dpopPrivateKey = importedPrivateKey;
		} else {
			const { privateKey, publicKey } = await jose.generateKeyPair('ES256', { extractable: true });
			[dpopPrivateKeyJwk, dpopPublicKeyJwk] = await Promise.all([
				jose.exportJWK(privateKey),
				jose.exportJWK(publicKey),
			]);
			dpopPrivateKey = privateKey;
		}

		if (!dpopPrivateKey || !dpopPrivateKeyJwk || !dpopPublicKeyJwk) {
			throw new Error("Missing DPoP key material for token refresh");
		}
		if (request.dpopSupported) {
			await context.tokenRequestBuilder.setDpopHeader(dpopPrivateKey, dpopPublicKeyJwk, jti);
		}
		dpop = {
			dpopAlg: dpop?.dpopAlg ?? 'ES256',
			dpopJti: jti,
			dpopPrivateKeyJwk,
			dpopPublicKeyJwk,
		};
	}

	let walletInstanceAttestation: string | null = null;
	if (request.attestationRequired) {
		if (!context.requestWalletInstanceAttestation) {
			throw new Error('Missing Wallet Provider for client attestation');
		}
		walletInstanceAttestation = await requestTokenWalletInstanceAttestation(
			context.requestWalletInstanceAttestation,
			dpopPublicKeyJwk,
			request.clientId,
			request.issuer,
		);
	}
	context.tokenRequestBuilder.setWalletInstanceAttestation(walletInstanceAttestation, dpopPrivateKey as jose.KeyLike);
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
