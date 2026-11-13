// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as jose from 'jose';
import { TextEncoder, TextDecoder } from 'node:util';
import { Buffer } from 'node:buffer';

Object.assign(globalThis, {
	TextEncoder,
	TextDecoder,
	Uint8Array: Object.getPrototypeOf(Buffer.prototype).constructor,
});
import { useCredentialRequest } from './CredentialRequest';
import { isKeyAttestationRequired } from './OpenID4VCI';

const mocks = vi.hoisted(() => ({
	providerPost: vi.fn(),
	issuerPost: vi.fn(),
	generateKeypairs: vi.fn(),
	generateProofs: vi.fn(),
	update: vi.fn(),
	commit: vi.fn(),
	metadata: vi.fn(),
	client: vi.fn(),
}));
vi.mock('../HttpProxy/HttpProxy', () => ({ useHttpProxy: () => ({ post: mocks.issuerPost }) }));
vi.mock('../OpenID4VCIHelper', () => ({
	useOpenID4VCIHelper: () => ({ getCredentialIssuerMetadata: mocks.metadata, getClientId: mocks.client }),
}));
vi.mock('@/context/SessionContext', () => ({
	useSessionContext: () => ({
		keystore: { generateKeypairs: mocks.generateKeypairs, generateOpenid4vciProofs: mocks.generateProofs },
		api: { post: mocks.providerPost, updatePrivateData: mocks.update },
	}),
}));
vi.mock('@/config', async (importOriginal) => ({
	...(await importOriginal<typeof import('@/config')>()),
	OPENID4VCI_MAX_ACCEPTED_BATCH_SIZE: 10,
}));

describe('credential proof construction', () => {
	it('recognizes empty and populated JWT key attestation requirements', () => {
		expect(isKeyAttestationRequired('jwt', {})).toBe(false);
		expect(isKeyAttestationRequired('jwt', { key_attestations_required: {} })).toBe(true);
		expect(
			isKeyAttestationRequired('jwt', { key_attestations_required: { key_storage: ['iso_18045_moderate'] } }),
		).toBe(true);
		expect(isKeyAttestationRequired('attestation')).toBe(true);
	});
	beforeEach(async () => {
		vi.clearAllMocks();
		const keys = await jose.generateKeyPair('ES256', { extractable: true });
		const publicKey = await jose.exportJWK(keys.publicKey);
		const privateKey = await jose.exportJWK(keys.privateKey);
		mocks.generateKeypairs.mockResolvedValue([
			{ keypairs: [{ publicKey, privateKey, alg: 'ES256' }] },
			{},
			mocks.commit,
		]);
		mocks.generateProofs.mockResolvedValue([{ proof_jwts: ['plain-proof'] }, {}, mocks.commit]);
		mocks.metadata.mockResolvedValue({ metadata: { credential_issuer: 'https://issuer.example' } });
		mocks.client.mockResolvedValue({ client_id: 'wallet' });
		mocks.issuerPost.mockResolvedValue({ status: 200, headers: {}, data: {} });
		const attestation = await new jose.SignJWT({ attested_keys: [publicKey] })
			.setProtectedHeader({ alg: 'ES256' })
			.sign(keys.privateKey);
		mocks.providerPost.mockResolvedValue({ data: { key_attestation: attestation } });
	});

	function setup() {
		const { result } = renderHook(() => useCredentialRequest());
		result.current.setCredentialIssuerIdentifier('https://issuer.example');
		result.current.setCredentialEndpoint('https://issuer.example/credential');
		return result.current;
	}

	it('sends a plain JWT when no key attestation is required', async () => {
		await setup().execute('credential', 'jwt', false);
		expect(mocks.issuerPost.mock.calls[0][1].proofs).toEqual({ jwt: ['plain-proof'] });
		expect(mocks.providerPost).not.toHaveBeenCalled();
	});

	it('sends a standalone attestation using the advertised proof type', async () => {
		await setup().execute('credential', 'attestation', true);
		const attestation = (await mocks.providerPost.mock.results[0].value).data.key_attestation;
		expect(mocks.issuerPost.mock.calls[0][1].proofs).toEqual({ attestation: [attestation] });
		expect(mocks.generateProofs).not.toHaveBeenCalled();
	});

	it('includes the key attestation in a signed JWT proof when required', async () => {
		const request = setup();
		request.setCNonce('issuer-nonce');
		await request.execute('credential', 'jwt', true);
		const proof = mocks.issuerPost.mock.calls[0][1].proofs.jwt[0];
		const header = jose.decodeProtectedHeader(proof);
		const attestation = (await mocks.providerPost.mock.results[0].value).data.key_attestation;
		expect(header.key_attestation).toBe(attestation);
		expect(jose.decodeJwt(proof)).toMatchObject({
			aud: 'https://issuer.example',
			nonce: 'issuer-nonce',
		});
		await expect(jose.jwtVerify(proof, await jose.importJWK(header.jwk!, 'ES256'))).resolves.toBeDefined();
	});

	it('rejects a key attestation for a different key', async () => {
		const keys = await jose.generateKeyPair('ES256');
		const attestation = await new jose.SignJWT({ attested_keys: [await jose.exportJWK(keys.publicKey)] })
			.setProtectedHeader({ alg: 'ES256' })
			.sign(keys.privateKey);
		mocks.providerPost.mockResolvedValue({ data: { key_attestation: attestation } });
		await expect(setup().execute('credential', 'jwt', true)).rejects.toThrow('Failed to generate proof');
		expect(mocks.issuerPost).not.toHaveBeenCalled();
	});
});
