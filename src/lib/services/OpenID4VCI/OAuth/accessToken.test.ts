import { assert, describe, expect, it, vi } from 'vitest';
import { accessTokenIsValid, refreshAccessToken, requestTokenWalletInstanceAttestation } from './accessToken';
import * as jose from 'jose';
import { GrantType } from './TokenRequest';

const tokenRequestBuilder = () => ({
	setTokenEndpoint: vi.fn(),
	setIssuer: vi.fn(),
	setGrantType: vi.fn(),
	setAuthorizationCode: vi.fn(),
	setPreAuthorizedCode: vi.fn(),
	setTxCode: vi.fn(),
	setAuthorizationResponseUrl: vi.fn(),
	setState: vi.fn(),
	setCodeVerifier: vi.fn(),
	setRefreshToken: vi.fn(),
	setClientId: vi.fn(),
	setAdditionalParameters: vi.fn(),
	setRedirectUri: vi.fn(),
	setWalletInstanceAttestation: vi.fn(),
	setDpopHeader: vi.fn(),
	execute: vi.fn().mockResolvedValue({
		response: {
			access_token: 'new-access-token',
			c_nonce: 'new-c-nonce',
			expires_in: 60,
			c_nonce_expires_in: 120,
			httpResponseHeaders: { 'dpop-nonce': 'nonce' },
		},
	}),
});

describe('OAuth access token handling', () => {
	it('identifies tokens that are valid beyond the skew window', () => {
		assert.strictEqual(accessTokenIsValid({ expiration_timestamp: 2000 }, 1000, 30), true);
		assert.strictEqual(accessTokenIsValid({ expiration_timestamp: 1020 }, 1000, 30), false);
	});

	it('refreshes a token and preserves the old refresh token when the response omits one', async () => {
		const builder = tokenRequestBuilder();

		const result = await refreshAccessToken(
			{
				tokenEndpoint: 'https://issuer.example/token',
				issuer: 'https://issuer.example',
				clientId: 'wallet-client',
				refreshToken: 'old-refresh-token',
				additionalParameters: { scope: 'credential-scope' },
			},
			{
				tokenRequestBuilder: builder,
				now: 1000,
			},
		);

		assert.strictEqual(result.tokenState.access_token, 'new-access-token');
		assert.strictEqual(result.tokenState.refresh_token, 'old-refresh-token');
		assert.strictEqual(result.tokenState.expiration_timestamp, 1060);
		assert.strictEqual(result.tokenState.c_nonce_expiration_timestamp, 1120);
		assert.deepEqual(result.headers, { 'dpop-nonce': 'nonce' });
		assert.deepEqual(builder.setGrantType.mock.calls[0], [GrantType.REFRESH]);
		assert.deepEqual(builder.setRefreshToken.mock.calls[0], ['old-refresh-token']);
		assert.deepEqual(builder.setAdditionalParameters.mock.calls[0], [{ scope: 'credential-scope' }]);
	});
	it.each([true, false])(
		'requests a fresh WIA with the original key during refresh (DPoP supported: %s)',
		async (dpopSupported) => {
			const builder = tokenRequestBuilder();
			const keys = await jose.generateKeyPair('ES256', { extractable: true });
			const dpop = {
				dpopAlg: 'ES256',
				dpopJti: 'original',
				dpopPrivateKeyJwk: await jose.exportJWK(keys.privateKey),
				dpopPublicKeyJwk: await jose.exportJWK(keys.publicKey),
			};
			const requestWia = vi.fn().mockResolvedValue({ wallet_instance_attestation: 'fresh-wia' });
			const result = await refreshAccessToken(
				{
					tokenEndpoint: 'https://issuer.example/token',
					issuer: 'https://issuer.example',
					clientId: 'wallet',
					refreshToken: 'refresh',
					attestationRequired: true,
					dpop,
					dpopSupported,
				},
				{ tokenRequestBuilder: builder, requestWalletInstanceAttestation: requestWia },
			);
			expect(requestWia).toHaveBeenCalledWith(
				{ ...dpop.dpopPublicKeyJwk, key_ops: ['verify'] },
				'wallet',
				'https://issuer.example',
			);
			expect(requestWia.mock.invocationCallOrder[0]).toBeLessThan(builder.execute.mock.invocationCallOrder[0]);
			assert.strictEqual(builder.setWalletInstanceAttestation.mock.calls[0][0], 'fresh-wia');
			expect(builder.setDpopHeader).toHaveBeenCalledTimes(dpopSupported ? 1 : 0);
			expect(builder.setWalletInstanceAttestation.mock.calls[0][1]).toBeTruthy();
			assert.strictEqual(
				dpopSupported && builder.setWalletInstanceAttestation.mock.calls[0][1],
				dpopSupported && builder.setDpopHeader.mock.calls[0][0],
			);
			assert.deepEqual(result.dpop?.dpopPrivateKeyJwk, dpop.dpopPrivateKeyJwk);
		},
	);

	it.each([true, false])(
		'rejects missing public key material before refresh (DPoP supported: %s)',
		async (dpopSupported) => {
			const builder = tokenRequestBuilder();
			const keys = await jose.generateKeyPair('ES256', { extractable: true });
			const requestWia = vi.fn();
			await expect(
				refreshAccessToken(
					{
						tokenEndpoint: 'https://issuer.example/token',
						issuer: 'https://issuer.example',
						clientId: 'wallet',
						refreshToken: 'refresh',
						attestationRequired: true,
						dpopSupported,
						dpop: { dpopAlg: 'ES256', dpopJti: 'original', dpopPrivateKeyJwk: await jose.exportJWK(keys.privateKey) },
					},
					{ tokenRequestBuilder: builder, requestWalletInstanceAttestation: requestWia },
				),
			).rejects.toThrow('Missing DPoP key material for token refresh');
			expect(requestWia).not.toHaveBeenCalled();
			expect(builder.setDpopHeader).not.toHaveBeenCalled();
			expect(builder.execute).not.toHaveBeenCalled();
		},
	);

	it('fails before sending when an attested refresh session has lost its key', async () => {
		const builder = tokenRequestBuilder();
		await expect(
			refreshAccessToken(
				{
					tokenEndpoint: 'https://issuer.example/token',
					issuer: 'https://issuer.example',
					clientId: 'wallet',
					refreshToken: 'refresh',
					attestationRequired: true,
				},
				{ tokenRequestBuilder: builder },
			),
		).rejects.toThrow('bound key');
		assert.strictEqual(builder.execute.mock.calls.length, 0);
	});

	it.each([null, 'failure'])('stops before token exchange when WIA retrieval returns %s', async (failure) => {
		const builder = tokenRequestBuilder();
		const keys = await jose.generateKeyPair('ES256', { extractable: true });
		const requestWia = vi.fn();
		if (failure === null) {
			requestWia.mockResolvedValue(null);
		} else {
			requestWia.mockRejectedValue(new Error('Provider unavailable'));
		}
		await expect(
			refreshAccessToken(
				{
					tokenEndpoint: 'https://issuer.example/token',
					issuer: 'https://issuer.example',
					clientId: 'wallet',
					refreshToken: 'refresh',
					attestationRequired: true,
					dpop: {
						dpopAlg: 'ES256',
						dpopJti: 'original',
						dpopPrivateKeyJwk: await jose.exportJWK(keys.privateKey),
						dpopPublicKeyJwk: await jose.exportJWK(keys.publicKey),
					},
				},
				{ tokenRequestBuilder: builder, requestWalletInstanceAttestation: requestWia },
			),
		).rejects.toThrow();
		expect(builder.execute).not.toHaveBeenCalled();
	});

	it('requires the session public key and client ID before requesting a WIA', async () => {
		const requestWia = vi.fn();
		await expect(
			requestTokenWalletInstanceAttestation(requestWia, undefined, 'wallet', 'https://issuer.example'),
		).rejects.toThrow('session public key and client ID');
		await expect(requestTokenWalletInstanceAttestation(requestWia, {}, null, 'https://issuer.example')).rejects.toThrow(
			'session public key and client ID',
		);
		expect(requestWia).not.toHaveBeenCalled();
	});

	it('does not contact the provider when client attestation is not required', async () => {
		const builder = tokenRequestBuilder();
		const requestWia = vi.fn();
		await refreshAccessToken(
			{
				tokenEndpoint: 'https://issuer.example/token',
				issuer: 'https://issuer.example',
				clientId: 'wallet',
				refreshToken: 'refresh',
			},
			{ tokenRequestBuilder: builder, requestWalletInstanceAttestation: requestWia },
		);
		expect(requestWia).not.toHaveBeenCalled();
		expect(builder.setWalletInstanceAttestation).toHaveBeenCalledWith(null, null);
	});
});
