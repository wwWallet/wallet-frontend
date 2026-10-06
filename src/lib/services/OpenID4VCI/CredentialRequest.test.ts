import { renderHook, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CompactEncrypt, compactDecrypt, exportJWK, generateKeyPair, importJWK } from 'jose';
import { OpenidCredentialIssuerMetadata } from 'wallet-common';
import { useCredentialRequest } from './CredentialRequest';

const mocks = vi.hoisted(() => ({ post: vi.fn(), getMetadata: vi.fn(), getClientId: vi.fn() }));
vi.mock('../HttpProxy/HttpProxy', () => ({ useHttpProxy: () => ({ post: mocks.post }) }));
vi.mock('../OpenID4VCIHelper', () => ({ useOpenID4VCIHelper: () => ({ getCredentialIssuerMetadata: mocks.getMetadata, getClientId: mocks.getClientId }) }));
vi.mock('../../utils/dpop', () => ({ generateDPoP: vi.fn().mockResolvedValue('dpop-proof') }));
vi.mock('@/config', () => ({ OPENID4VCI_MAX_ACCEPTED_BATCH_SIZE: 10 }));
vi.mock('@/context/SessionContext', async () => {
	const { createContext } = await import('react');
	return { default: createContext({ keystore: {}, api: { post: vi.fn(), updatePrivateData: vi.fn() } }) };
});

const issuer = 'https://issuer.example';
const deferredEndpoint = issuer + '/deferred-credential';

async function setup(requestEncryption = true, responseEncryption = true) {
	const keys = await generateKeyPair('ECDH-ES');
	const metadata = {
		credential_issuer: issuer,
		credential_endpoint: issuer + '/credential',
		deferred_credential_endpoint: deferredEndpoint,
		credential_configurations_supported: {},
		...(requestEncryption ? { credential_request_encryption: {
			encryption_required: true,
			enc_values_supported: ['A256GCM'],
			jwks: { keys: [{ ...await exportJWK(keys.publicKey), alg: 'ECDH-ES', kid: 'issuer-key' }] },
		} } : {}),
		...(responseEncryption ? { credential_response_encryption: {
			encryption_required: true,
			alg_values_supported: ['ECDH-ES'],
			enc_values_supported: ['A256GCM'],
		} } : {}),
	} as OpenidCredentialIssuerMetadata;
	mocks.getMetadata.mockResolvedValue({ metadata });
	mocks.getClientId.mockResolvedValue({ client_id: 'wallet' });
	const { result } = renderHook(() => useCredentialRequest());
	result.current.setCredentialIssuerIdentifier(issuer);
	result.current.setDeferredCredentialEndpoint(deferredEndpoint);
	result.current.setAccessToken('access-token');
	return { builder: result.current, metadata, keys };
}

describe('deferred credential request encryption', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		// jsdom's Uint8Array has a different realm from Node's TextEncoder and jose.
		vi.stubGlobal('Uint8Array', new TextEncoder().encode('').constructor);
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.spyOn(console, 'log').mockImplementation(() => {});
	});
	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('encrypts polls, preserves authentication, decrypts pending and completed responses, and rotates response keys', async () => {
		const { builder, keys } = await setup();
		const responseKeys: unknown[] = [];
		const payloads = [{ transaction_id: 'transaction', interval: 30 }, { credentials: [{ credential: 'issued' }] }];
		builder.setDpopPublicKeyJwk(await exportJWK(keys.publicKey));
		builder.setDpopJti('jti');
		// Resetting mocks above also resets the DPoP generator's implementation.
		const { generateDPoP } = await import('../../utils/dpop');
		vi.mocked(generateDPoP).mockResolvedValue('dpop-proof');
		await builder.setDpopHeader();
		mocks.post.mockImplementation(async (url, body, headers) => {
			expect(url).toBe(deferredEndpoint);
			expect(headers).toMatchObject({ 'Content-Type': 'application/jwt', Authorization: 'DPoP access-token', dpop: 'dpop-proof' });
			const { plaintext, protectedHeader } = await compactDecrypt(body, keys.privateKey);
			expect(protectedHeader).toMatchObject({ alg: 'ECDH-ES', enc: 'A256GCM', kid: 'issuer-key' });
			const poll = JSON.parse(new TextDecoder().decode(plaintext));
			expect(poll).toMatchObject({ transaction_id: 'transaction', credential_response_encryption: { enc: 'A256GCM', jwk: { alg: 'ECDH-ES', use: 'enc' } } });
			expect(poll.proofs).toBeUndefined();
			responseKeys.push(poll.credential_response_encryption.jwk);
			const publicKey = await importJWK(poll.credential_response_encryption.jwk, 'ECDH-ES');
			const data = await new CompactEncrypt(new TextEncoder().encode(JSON.stringify(payloads[responseKeys.length - 1])))
				.setProtectedHeader({ alg: 'ECDH-ES', enc: 'A256GCM' }).encrypt(publicKey);
			return { status: responseKeys.length === 1 ? 202 : 200, headers: { 'content-type': 'application/jwt; charset=utf-8' }, data };
		});
		const pending = await builder.executeDeferredFetch('transaction');
		expect(vi.mocked(console.log).mock.calls.at(-1)?.[3]).toBe(mocks.post.mock.calls[0][2]);
		expect(pending.credentialResponse).toMatchObject({ status: 202, data: payloads[0] });
		const completed = await builder.executeDeferredFetch('transaction');
		expect(completed.credentialResponse).toMatchObject({ status: 200, data: payloads[1] });
		expect(responseKeys[0]).not.toEqual(responseKeys[1]);
		expect(mocks.getMetadata).toHaveBeenCalledWith(issuer, false);
	});

	it('preserves plain JSON polling for issuers without encryption metadata', async () => {
		const { builder } = await setup(false, false);
		const response = { status: 200, headers: { 'content-type': 'application/json' }, data: { credentials: [{ credential: 'issued' }] } };
		mocks.post.mockResolvedValue(response);
		expect(await builder.executeDeferredFetch('transaction')).toEqual({ credentialResponse: response });
		expect(mocks.post).toHaveBeenCalledWith(deferredEndpoint, { transaction_id: 'transaction' }, { 'Content-Type': 'application/json', Authorization: 'Bearer access-token' });
	});

	it('supports request encryption without response encryption', async () => {
		const { builder, keys } = await setup(true, false);
		mocks.post.mockImplementation(async (_url, body) => {
			const { plaintext } = await compactDecrypt(body, keys.privateKey);
			expect(JSON.parse(new TextDecoder().decode(plaintext))).toEqual({ transaction_id: 'transaction' });
			return { status: 202, headers: { 'content-type': 'application/json' }, data: { transaction_id: 'transaction', interval: 30 } };
		});
		expect((await builder.executeDeferredFetch('transaction')).credentialResponse.status).toBe(202);
	});

	it.each(['request', 'response'])('rejects unsupported required %s encryption before sending a poll', async (direction) => {
		const { builder, metadata } = await setup();
		metadata[`credential_${direction}_encryption`].enc_values_supported = ['unsupported'];
		await expect(builder.executeDeferredFetch('transaction')).rejects.toThrow('Deferred Credential Request failed');
		expect(mocks.post).not.toHaveBeenCalled();
	});

	it('rejects required response encryption if the issuer cannot encrypt requests', async () => {
		const { builder } = await setup(false, true);
		await expect(builder.executeDeferredFetch('transaction')).rejects.toThrow('Deferred Credential Request failed');
		expect(mocks.post).not.toHaveBeenCalled();
	});

	it('falls back to JSON when optional encryption is unsupported', async () => {
		const { builder, metadata } = await setup();
		metadata.credential_request_encryption.encryption_required = false;
		metadata.credential_request_encryption.enc_values_supported = ['unsupported'];
		metadata.credential_response_encryption.encryption_required = false;
		mocks.post.mockResolvedValue({ status: 202, headers: {}, data: { transaction_id: 'transaction' } });
		await builder.executeDeferredFetch('transaction');
		expect(mocks.post).toHaveBeenCalledWith(deferredEndpoint, { transaction_id: 'transaction' }, expect.objectContaining({ 'Content-Type': 'application/json' }));
	});

	it.each(['invalid-jwe', 'wrong-key', 'plaintext'])('rejects a %s successful response when response encryption is required', async (kind) => {
		const { builder } = await setup();
		let data: unknown = 'invalid-jwe';
		if (kind === 'wrong-key') {
			const wrongKeys = await generateKeyPair('ECDH-ES');
			data = await new CompactEncrypt(new TextEncoder().encode('{}')).setProtectedHeader({ alg: 'ECDH-ES', enc: 'A256GCM' }).encrypt(wrongKeys.publicKey);
		}
		mocks.post.mockResolvedValue({ status: 200, headers: { 'content-type': kind === 'plaintext' ? 'application/json' : 'application/jwt' }, data });
		await expect(builder.executeDeferredFetch('transaction')).rejects.toThrow('Deferred Credential Request failed');
		expect(mocks.post).toHaveBeenCalledTimes(1);
	});

	it('returns plaintext protocol errors to the polling caller', async () => {
		const { builder } = await setup();
		const response = { status: 400, headers: { 'content-type': 'application/json' }, data: { error: 'invalid_transaction_id' } };
		mocks.post.mockResolvedValue(response);
		expect(await builder.executeDeferredFetch('transaction')).toEqual({ credentialResponse: response });
	});

	it('does not retain the JWT content type when metadata switches to plaintext polling', async () => {
		const { builder, metadata } = await setup(true, false);
		mocks.post.mockResolvedValue({ status: 202, headers: {}, data: { transaction_id: 'transaction' } });
		await builder.executeDeferredFetch('transaction');
		delete metadata.credential_request_encryption;
		await builder.executeDeferredFetch('transaction');
		expect(mocks.post).toHaveBeenLastCalledWith(deferredEndpoint, { transaction_id: 'transaction' }, expect.objectContaining({ 'Content-Type': 'application/json' }));
	});

	it('preserves initial request encryption', async () => {
		const { builder, keys } = await setup();
		builder.setCredentialEndpoint(issuer + '/credential');
		mocks.post.mockImplementation(async (url, body) => {
			expect(url).toBe(issuer + '/credential');
			const { plaintext } = await compactDecrypt(body, keys.privateKey);
			const request = JSON.parse(new TextDecoder().decode(plaintext));
			expect(request).toMatchObject({ credential_configuration_id: 'example', proofs: { jwt: ['cached-proof'] } });
			const key = await importJWK(request.credential_response_encryption.jwk, 'ECDH-ES');
			const data = await new CompactEncrypt(new TextEncoder().encode(JSON.stringify({ transaction_id: 'transaction', interval: 30 })))
				.setProtectedHeader({ alg: 'ECDH-ES', enc: 'A256GCM' }).encrypt(key);
			return { status: 202, headers: { 'Content-Type': 'application/jwt' }, data };
		});
		expect((await builder.execute('example', 'jwt', ['cached-proof'])).credentialResponse).toMatchObject({ status: 202, data: { transaction_id: 'transaction', interval: 30 } });
	});
});
