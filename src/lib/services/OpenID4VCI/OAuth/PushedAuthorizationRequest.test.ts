// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as jose from 'jose';
import { createPrivateKey, createPublicKey } from 'node:crypto';
import { usePushedAuthorizationRequest } from './PushedAuthorizationRequest';

const mocks = vi.hoisted(() => ({
	post: vi.fn(),
	requestWia: vi.fn(),
	generateKeyPair: vi.fn(),
}));

vi.mock('../../HttpProxy/HttpProxy', () => ({ useHttpProxy: () => ({ post: mocks.post }) }));
vi.mock('../../WalletProvider', () => ({
	useWalletProvider: () => ({ requestWalletAttestation: mocks.requestWia }),
}));
vi.mock('@/config', () => ({ MODE: 'production', OPENID4VCI_PROFILE: 'DEFAULT' }));
vi.mock('jose', async (importOriginal) => ({
	...(await importOriginal<typeof import('jose')>()),
	generateKeyPair: mocks.generateKeyPair,
}));

const metadata = {
	issuer: 'https://as.example/tenant/',
	token_endpoint: 'https://as.example/token',
	pushed_authorization_request_endpoint: 'https://as.example/par',
	token_endpoint_auth_methods_supported: ['attest_jwt_client_auth'],
};
const createParams = () => ({
	client_id: 'https://wallet.example/callback/',
	redirect_uri: 'https://wallet.example/callback/',
	response_type: 'code',
});

describe('WIA retrieval before PAR', () => {
	afterEach(() => vi.unstubAllGlobals());

	beforeEach(() => {
		// Match the ArrayBuffer realm of the Node WebCrypto installed by setup-vitest.
		vi.stubGlobal('ArrayBuffer', Buffer.alloc(0).buffer.constructor);
		// Browser jose generates WebCrypto keys, while its Node entry generates KeyObjects.
		mocks.generateKeyPair
			.mockReset()
			.mockImplementation(() =>
				crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']),
			);
		mocks.post.mockReset().mockResolvedValue({
			status: 201,
			headers: { 'content-type': 'application/json' },
			data: { request_uri: 'urn:example:par:request', expires_in: 60 },
		});
		mocks.requestWia.mockReset().mockResolvedValue({ wallet_attestation: 'provider-signed-wia' });
	});

	it('requests WIA before PAR and returns the matching flow key for encrypted persistence', async () => {
		const { result } = renderHook(() => usePushedAuthorizationRequest());
		const response = await result.current.sendPushedAuthorizationRequest(metadata, createParams());
		const [publicJwk, clientId, issuer] = mocks.requestWia.mock.calls[0];
		expect(mocks.generateKeyPair).toHaveBeenCalledWith('ES256', { extractable: true });
		expect(publicJwk).not.toHaveProperty('d');
		expect(publicJwk.key_ops).toEqual(['verify']);
		expect(clientId).toBe('https://wallet.example/callback/');
		expect(issuer).toBe(metadata.issuer);
		expect(mocks.requestWia.mock.invocationCallOrder[0]).toBeLessThan(mocks.post.mock.invocationCallOrder[0]);
		expect(response.dpop?.dpopPublicKeyJwk).toEqual(publicJwk);
		const privateKey = createPrivateKey({ key: response.dpop!.dpopPrivateKeyJwk, format: 'jwk' });
		const { key_ops, ...publicKeyMaterial } = publicJwk;
		expect(key_ops).toEqual(['verify']);
		expect(createPublicKey(privateKey).export({ format: 'jwk' })).toEqual(publicKeyMaterial);
		const body = new URLSearchParams(mocks.post.mock.calls[0][1]);
		expect(body.get('dpop_jkt')).toBe(await jose.calculateJwkThumbprint(publicJwk));
		expect(body.get('code_challenge_method')).toBe('S256');
		expect(response.code_verifier).toBeTruthy();
		const headers = mocks.post.mock.calls[0][2];
		expect(headers['oauth-client-attestation']).toBe('provider-signed-wia');
		const proof = await jose.jwtVerify(
			headers['oauth-client-attestation-pop'],
			await jose.importJWK(publicJwk, 'ES256'),
			{
				audience: metadata.issuer,
				typ: 'oauth-client-attestation-pop+jwt',
			},
		);
		expect(proof.payload.jti).toBeTruthy();
		expect(body.has('client_assertion')).toBe(false);
	});

	it('retries a challenge error once with a fresh proof and preserves PKCE', async () => {
		mocks.post.mockResolvedValueOnce({
			status: 400,
			headers: { 'oauth-client-attestation-challenge': 'fresh-challenge' },
			data: { error: 'use_attestation_challenge' },
		});
		const { result } = renderHook(() => usePushedAuthorizationRequest());
		await result.current.sendPushedAuthorizationRequest(metadata, createParams());
		expect(mocks.post).toHaveBeenCalledTimes(2);
		const first = jose.decodeJwt(mocks.post.mock.calls[0][2]['oauth-client-attestation-pop']);
		const second = jose.decodeJwt(mocks.post.mock.calls[1][2]['oauth-client-attestation-pop']);
		expect(second.challenge).toBe('fresh-challenge');
		expect(second.jti).not.toBe(first.jti);
		expect(mocks.post.mock.calls[1][1]).toBe(mocks.post.mock.calls[0][1]);
	});

	it('does not retry indefinitely when the server keeps requiring a challenge', async () => {
		mocks.post.mockResolvedValue({
			status: 400,
			headers: { 'oauth-client-attestation-challenge': 'fresh-challenge' },
			data: { error: 'use_attestation_challenge' },
		});
		const { result } = renderHook(() => usePushedAuthorizationRequest());
		await expect(result.current.sendPushedAuthorizationRequest(metadata, createParams())).rejects.toThrow(
			'use_attestation_challenge',
		);
		expect(mocks.post).toHaveBeenCalledTimes(2);
	});

	it('does not retry a challenge error without a challenge header', async () => {
		mocks.post.mockResolvedValue({ status: 400, headers: {}, data: { error: 'use_attestation_challenge' } });
		const { result } = renderHook(() => usePushedAuthorizationRequest());
		await expect(result.current.sendPushedAuthorizationRequest(metadata, createParams())).rejects.toThrow(
			'use_attestation_challenge',
		);
		expect(mocks.post).toHaveBeenCalledOnce();
	});

	it('preserves existing PAR behavior when ABCA is not advertised', async () => {
		const { result } = renderHook(() => usePushedAuthorizationRequest());
		const response = await result.current.sendPushedAuthorizationRequest(
			{
				...metadata,
				token_endpoint_auth_methods_supported: ['none'],
			},
			createParams(),
		);
		expect(mocks.generateKeyPair).not.toHaveBeenCalled();
		expect(mocks.requestWia).not.toHaveBeenCalled();
		expect(response.dpop).toBeUndefined();
		expect(mocks.post).toHaveBeenCalledOnce();
	});

	it('stops before WIA and PAR when key generation fails', async () => {
		mocks.generateKeyPair.mockRejectedValue(new Error('Key generation failed'));
		const { result } = renderHook(() => usePushedAuthorizationRequest());
		await expect(result.current.sendPushedAuthorizationRequest(metadata, createParams())).rejects.toThrow(
			'Key generation failed',
		);
		expect(mocks.requestWia).not.toHaveBeenCalled();
		expect(mocks.post).not.toHaveBeenCalled();
	});

	it('stops before PAR when WIA generation fails', async () => {
		mocks.requestWia.mockResolvedValue(null);
		const { result } = renderHook(() => usePushedAuthorizationRequest());
		await expect(result.current.sendPushedAuthorizationRequest(metadata, createParams())).rejects.toThrow(
			'Failed to get Wallet Attestation',
		);
		expect(mocks.post).not.toHaveBeenCalled();
	});
});
