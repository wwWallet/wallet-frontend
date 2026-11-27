// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPublicKey, verify } from 'node:crypto';
import { GrantType, TokenRequestError, useTokenRequest } from './TokenRequest';

const mocks = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('../../HttpProxy/HttpProxy', () => ({ useHttpProxy: () => ({ post: mocks.post }) }));
vi.mock('@/config', () => ({
	MODE: 'production',
	OPENID4VCI_PROFILE: 'DEFAULT',
	OPENID4VCI_REDIRECT_URI: 'https://wallet.example/callback',
}));

const success = {
	status: 200,
	headers: { 'content-type': 'application/json' },
	data: { access_token: 'token', token_type: 'Bearer', expires_in: 60 },
};
const challenge = {
	status: 400,
	headers: { 'content-type': 'application/json', 'OAuth-Client-Attestation-Challenge': 'challenge' },
	data: { error: 'use_attestation_challenge' },
};

function builder() {
	const { result } = renderHook(() => useTokenRequest());
	const request = result.current;
	request.setTokenEndpoint('https://as.example/token');
	request.setIssuer('https://as.example/tenant');
	request.setClientId('wallet');
	request.setRedirectUri('https://wallet.example/callback');
	request.setAuthorizationCode('code');
	request.setState('state');
	request.setAuthorizationResponseUrl('https://wallet.example/callback?code=code&state=state');
	request.setCodeVerifier('verifier');
	return request;
}

async function keypair() {
	return crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
}

function proof(call: number) {
	return mocks.post.mock.calls[call][2]['oauth-client-attestation-pop'];
}

function payload(jwt: string) {
	return JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString());
}

describe('Token request attestation authentication', () => {
	beforeEach(async () => {
		mocks.post.mockReset().mockResolvedValue(success);
		// Match Node WebCrypto's buffer realm for oauth4webapi's instanceof checks.
		const buffer = await crypto.subtle.digest('SHA-256', new Uint8Array());
		vi.stubGlobal('ArrayBuffer', buffer.constructor);
	});

	it.each([GrantType.AUTHORIZATION_CODE, GrantType.REFRESH, GrantType.PRE_AUTHORIZED_CODE])(
		'authenticates %s using the saved WIA and key',
		async (grant) => {
			const request = builder();
			const keys = await keypair();
			request.setGrantType(grant);
			request.setRefreshToken('refresh');
			request.setPreAuthorizedCode('offer-code');
			request.setWalletAttestation('saved-wia', keys.privateKey);
			await expect(request.execute()).resolves.toMatchObject({
				response: { access_token: 'token', token_type: 'bearer' },
			});
			expect(mocks.post.mock.calls[0][2]['oauth-client-attestation']).toBe('saved-wia');
			const jwt = proof(0);
			expect(payload(jwt)).toMatchObject({ aud: 'https://as.example/tenant' });
			const [header, body, signature] = jwt.split('.');
			const jwk = await crypto.subtle.exportKey('jwk', keys.publicKey);
			expect(
				verify(
					'sha256',
					Buffer.from(`${header}.${body}`),
					{
						key: createPublicKey({ key: { ...jwk }, format: 'jwk' }),
						dsaEncoding: 'ieee-p1363',
					},
					Buffer.from(signature, 'base64url'),
				),
			).toBe(true);
			expect(new URLSearchParams(mocks.post.mock.calls[0][1]).get('client_id')).toBe('wallet');
		},
	);

	it('redeems an anonymous pre-authorized offer without DPoP for a Bearer issuer', async () => {
		const request = builder();
		request.setGrantType(GrantType.PRE_AUTHORIZED_CODE);
		request.setClientId(null);
		request.setPreAuthorizedCode('offer-code');
		request.setTxCode('12345');

		await expect(request.execute()).resolves.toMatchObject({ response: { token_type: 'bearer' } });
		const [, body, headers] = mocks.post.mock.calls[0];
		expect(Object.fromEntries(new URLSearchParams(body))).toEqual({
			grant_type: GrantType.PRE_AUTHORIZED_CODE,
			'pre-authorized_code': 'offer-code',
			tx_code: '12345',
		});
		expect(headers).not.toHaveProperty('dpop');
		expect(headers).not.toHaveProperty('oauth-client-attestation');
	});

	it('retries an attestation challenge once with a fresh proof', async () => {
		const request = builder();
		request.setWalletAttestation('saved-wia', (await keypair()).privateKey);
		mocks.post.mockResolvedValueOnce(challenge);
		await request.execute();
		expect(payload(proof(1))).toMatchObject({ challenge: 'challenge' });
		expect(payload(proof(0)).jti).not.toBe(payload(proof(1)).jti);
		expect(mocks.post).toHaveBeenCalledTimes(2);
	});

	it('bounds repeated challenges and normalizes the final error', async () => {
		const request = builder();
		request.setWalletAttestation('saved-wia', (await keypair()).privateKey);
		mocks.post.mockResolvedValue(challenge);
		await expect(request.execute()).resolves.toMatchObject({ error: TokenRequestError.FAILED });
		expect(mocks.post).toHaveBeenCalledTimes(2);
	});

	it('preserves unauthenticated flows and clears authentication between sessions', async () => {
		const request = builder();
		request.setWalletAttestation('saved-wia', (await keypair()).privateKey);
		request.setWalletAttestation(null);
		await request.execute();
		expect(mocks.post.mock.calls[0][2]['oauth-client-attestation']).toBeUndefined();
	});

	it('clears a previous DPoP key and nonce before a standalone attested token request', async () => {
		const request = builder();
		const keys = await keypair();
		request.setWalletAttestation('saved-wia', keys.privateKey);
		await request.setDpopHeader(keys.privateKey, { ...(await crypto.subtle.exportKey('jwk', keys.publicKey)) }, 'jti');
		mocks.post.mockResolvedValueOnce({
			...success,
			headers: { ...success.headers, 'dpop-nonce': 'old-nonce' },
			data: { ...success.data, token_type: 'DPoP' },
		});
		await expect(request.execute()).resolves.toMatchObject({ response: { access_token: 'token' } });
		expect(mocks.post.mock.calls[0][2].dpop).toBeTruthy();

		request.clearDpopHeader();
		await expect(request.execute()).resolves.toMatchObject({ response: { access_token: 'token' } });
		expect(mocks.post.mock.calls[1][2].dpop).toBeUndefined();
		expect(proof(1)).toBeTruthy();
	});

	it.each([
		{ grant: GrantType.AUTHORIZATION_CODE, attestationFirst: true },
		{ grant: GrantType.AUTHORIZATION_CODE, attestationFirst: false },
		{ grant: GrantType.PRE_AUTHORIZED_CODE, attestationFirst: true },
		{ grant: GrantType.PRE_AUTHORIZED_CODE, attestationFirst: false },
	])('handles challenges for $grant (attestation first: $attestationFirst)', async ({ grant, attestationFirst }) => {
		const request = builder();
		request.setGrantType(grant);
		request.setPreAuthorizedCode('offer-code');
		const keys = await keypair();
		request.setWalletAttestation('saved-wia', keys.privateKey);
		await request.setDpopHeader(keys.privateKey, { ...(await crypto.subtle.exportKey('jwk', keys.publicKey)) }, 'jti');
		const nonce = {
			status: 400,
			headers: { 'content-type': 'application/json', 'dpop-nonce': 'nonce' },
			data: { error: 'use_dpop_nonce' },
		};
		mocks.post
			.mockResolvedValueOnce(attestationFirst ? challenge : nonce)
			.mockResolvedValueOnce(attestationFirst ? nonce : challenge)
			.mockResolvedValueOnce({ ...success, data: { ...success.data, token_type: 'DPoP' } });
		await expect(request.execute()).resolves.toMatchObject({ response: { access_token: 'token' } });
		expect(mocks.post).toHaveBeenCalledTimes(3);
		expect(payload(proof(2)).challenge).toBe('challenge');
		expect(payload(mocks.post.mock.calls[2][2].dpop).nonce).toBe('nonce');
		expect(new Set([0, 1, 2].map((index) => payload(proof(index)).jti)).size).toBe(3);
	});

	it.each([null, ''])('rejects attested requests without an explicit client ID (%s)', async (clientId) => {
		const request = builder();
		request.setClientId(clientId);
		request.setWalletAttestation('saved-wia', (await keypair()).privateKey);
		await expect(request.execute()).rejects.toThrow('requires a client ID');
		expect(mocks.post).not.toHaveBeenCalled();
	});

	it('uses the default client for an unattested refresh without a client ID', async () => {
		const request = builder();
		request.setClientId(null);
		request.setGrantType(GrantType.REFRESH);
		request.setRefreshToken('refresh');
		await expect(request.execute()).resolves.toMatchObject({ response: { access_token: 'token' } });
		expect(new URLSearchParams(mocks.post.mock.calls[0][1]).get('client_id')).toBe('https://wallet.example/callback');
	});

	it('rejects an empty WIA even with a key', async () => {
		const request = builder();
		const keys = await keypair();
		expect(() => request.setWalletAttestation('', keys.privateKey)).toThrow('bound private key');
		expect(mocks.post).not.toHaveBeenCalled();
	});

	it('rejects a WIA without its key', () => {
		expect(() => builder().setWalletAttestation('saved-wia')).toThrow('bound private key');
		expect(mocks.post).not.toHaveBeenCalled();
	});
});
