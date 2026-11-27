// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWalletProvider } from './WalletProvider';

const mocks = vi.hoisted(() => ({ post: vi.fn(), profile: 'DEFAULT' }));

vi.mock('@/context/SessionContext', () => ({
	useSessionContext: () => ({ api: { post: mocks.post } }),
}));

vi.mock('@/config', () => ({
	get OPENID4VCI_PROFILE() {
		return mocks.profile;
	},
}));

const publicJwk = { kty: 'EC', crv: 'P-256', x: 'public-x', y: 'public-y' };

describe('Wallet Provider WIA request', () => {
	beforeEach(() => {
		mocks.post.mockReset();
		mocks.profile = 'DEFAULT';
	});
	afterEach(() => vi.restoreAllMocks());

	it('uses authenticated backend post with the public key, client ID and AS issuer', async () => {
		mocks.post.mockResolvedValue({ data: { wallet_attestation: 'provider-signed-wia' } });
		const { result } = renderHook(() => useWalletProvider());
		const response = await result.current.requestWalletAttestation(
			publicJwk,
			'https://wallet.example/callback/',
			'https://as.example/tenant/',
		);
		expect(mocks.post).toHaveBeenCalledWith('/wallet-provider/wallet-attestation/generate', {
			jwks: [publicJwk],
			openid4vci: {
				client_id: 'https://wallet.example/callback/',
				authorization_server: 'https://as.example/tenant/',
			},
		});
		expect(response).toEqual({ wallet_attestation: 'provider-signed-wia' });
	});

	it.each([undefined, null, {}, { wallet_attestation: '' }, { wallet_attestation: 123 }])(
		'returns null for an invalid response: %j',
		async (data) => {
			mocks.post.mockResolvedValue({ data });
			const { result } = renderHook(() => useWalletProvider());
			await expect(
				result.current.requestWalletAttestation(publicJwk, 'wallet', 'https://as.example'),
			).resolves.toBeNull();
		},
	);

	it.each(['valid', 'expired', 'missing exp', 'short status period'])(
		'checks the WEBUILD Wallet Attestation lifetime and maintenance period (%s)',
		async (scenario) => {
			mocks.profile = 'WEBUILD';
			vi.spyOn(console, 'error').mockImplementation(() => {});
			const now = Math.floor(Date.now() / 1000);
			const minimumPeriod = 31 * 24 * 60 * 60;
			const payload = {
				exp: scenario === 'missing exp' ? undefined : now + (scenario === 'expired' ? 0 : 60),
				client_status: { exp: now + minimumPeriod + (scenario === 'short status period' ? -1 : 60) },
			};
			const token = `eyJhbGciOiJFUzI1NiJ9.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
			mocks.post.mockResolvedValue({ data: { wallet_attestation: token } });
			const { result } = renderHook(() => useWalletProvider());
			const response = await result.current.requestWalletAttestation(publicJwk, 'wallet', 'https://as.example');
			expect(response).toEqual(scenario === 'valid' ? { wallet_attestation: token } : null);
		},
	);

	it('returns null when the backend request fails', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		mocks.post.mockRejectedValue(new Error('Backend unavailable'));
		const { result } = renderHook(() => useWalletProvider());
		await expect(
			result.current.requestWalletAttestation(publicJwk, 'wallet', 'https://as.example'),
		).resolves.toBeNull();
	});
});
