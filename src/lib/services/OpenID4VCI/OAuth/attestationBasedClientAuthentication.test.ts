// @vitest-environment node

import * as jose from 'jose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OpenidAuthorizationServerMetadata } from 'wallet-common';
import {
	getClientAttestationHeaders,
	getClientInstance,
	parseAttesterX5c,
} from './attestationBasedClientAuthentication';

const config = vi.hoisted(() => ({
	OPENID4VCI_CLIENT_ATTESTATION_ATTESTER_PRIVATE_JWK: JSON.stringify({
		kty: 'EC',
		x: 'oNvNS72UFh3_VXyuxU7YLBLXB7pWNE5cEfe8hBePlm4',
		y: 'JIJ2JYG51_Vx5PmZ5CChNJYjrwvEEp0LV0oQonfgRNM',
		crv: 'P-256',
		d: 'odpRuIeTqgvk0RblRWAMnSRpFz-2WITXGLJd4esxTNE',
	}),
	OPENID4VCI_CLIENT_ATTESTATION_ATTESTER_X5C: JSON.stringify(['dGVzdA==']),
	OPENID4VCI_CLIENT_ATTESTATION_ENABLED: true,
	OPENID4VCI_CLIENT_ATTESTATION_LIFETIME_SECONDS: 300,
}));

vi.mock('@/config', () => config);

const asMeta = {
	issuer: 'https://as.example',
	authorization_endpoint: 'https://as.example/authorize',
	token_endpoint: 'https://as.example/token',
} as OpenidAuthorizationServerMetadata;

const httpProxy = {
	get: vi.fn(),
	post: vi.fn().mockResolvedValue({
		status: 200,
		headers: {},
		data: { attestation_challenge: 'challenge' },
	}),
};

describe('attestation-based client authentication', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('attaches the Wallet Provider certificate chain and omits iss', async () => {
		const headers = await getClientAttestationHeaders(
			asMeta,
			'wallet-client',
			httpProxy,
		);
		const attestation = headers['OAuth-Client-Attestation'];

		expect(jose.decodeProtectedHeader(attestation)).toEqual({
			alg: 'ES256',
			typ: 'oauth-client-attestation+jwt',
			x5c: ['dGVzdA=='],
		});
		expect(jose.decodeJwt(attestation)).toMatchObject({
			sub: 'wallet-client',
			cnf: { jwk: { kty: 'EC', crv: 'P-256' } },
		});
		expect(jose.decodeJwt(attestation)).not.toHaveProperty('iss');

		const clientInstance = await getClientInstance('wallet-client');
		const attestationPayload = jose.decodeJwt(attestation);
		expect((attestationPayload.cnf as { jwk: jose.JWK }).jwk).toEqual(clientInstance.publicJwk);
		await expect(jose.jwtVerify(
			headers['OAuth-Client-Attestation-PoP'],
			clientInstance.privateKey,
		)).resolves.toBeDefined();
	});

	it('rejects a missing or malformed certificate chain', () => {
		expect(() => parseAttesterX5c(undefined)).toThrow(/must contain/);
		expect(() => parseAttesterX5c('["not base64"]')).toThrow(/invalid base64 DER/);
	});
});
