import { renderHook, cleanup } from '@testing-library/react';
import { Blob as NodeBlob } from 'node:buffer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CompactEncrypt, compactDecrypt, exportJWK, generateKeyPair, importJWK } from 'jose';
import { OpenidCredentialIssuerMetadata } from 'wallet-common';
import { compressionOptions, useCredentialRequest } from './CredentialRequest';

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
			expect(poll.credential_response_encryption.zip).toBeUndefined();
			responseKeys.push(poll.credential_response_encryption.jwk);
			const publicKey = await importJWK(poll.credential_response_encryption.jwk, 'ECDH-ES');
			const data = await new CompactEncrypt(new TextEncoder().encode(JSON.stringify(payloads[responseKeys.length - 1])))
				.setProtectedHeader({ alg: 'ECDH-ES', enc: 'A256GCM' }).encrypt(publicKey);
			return { status: responseKeys.length === 1 ? 202 : 200, headers: { 'content-type': 'application/jwt; charset=utf-8' }, data };
		});
		const pending = await builder.executeDeferredFetch('transaction');
		expect(JSON.stringify(vi.mocked(console.log).mock.calls)).not.toContain('access-token');
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

	it.each([200, 202])('rejects plaintext HTTP %s when optional response encryption was requested', async (status) => {
		const { builder, metadata, keys } = await setup();
		metadata.credential_response_encryption.encryption_required = false;
		mocks.post.mockImplementation(async (_url, body) => {
			const { plaintext } = await compactDecrypt(body, keys.privateKey);
			const poll = JSON.parse(new TextDecoder().decode(plaintext));
			expect(poll.credential_response_encryption).toBeDefined();
			return { status, headers: { 'content-type': 'application/json' }, data: status === 200 ? { credentials: [{ credential: 'issued' }] } : { transaction_id: 'transaction', interval: 30 } };
		});
		await expect(builder.executeDeferredFetch('transaction')).rejects.toThrow('Deferred Credential Request failed');
		expect(mocks.post).toHaveBeenCalledTimes(1);
	});

	it.each([
		['request', true], ['request', false], ['response', true], ['response', false],
	] as const)('keeps %s encryption enabled with unsupported compression when required is %s', async (direction, required) => {
		const { builder, metadata, keys } = await setup();
		metadata[`credential_${direction}_encryption`].zip_values_supported = ['unsupported'];
		metadata.credential_request_encryption.encryption_required = required;
		metadata.credential_response_encryption.encryption_required = required;
		const payload = { credentials: [{ credential: 'issued' }] };
		mocks.post.mockImplementation(async (_url, body, headers) => {
			expect(headers['Content-Type']).toBe('application/jwt');
			const { plaintext, protectedHeader } = await compactDecrypt(body, keys.privateKey);
			expect(protectedHeader.zip).toBeUndefined();
			const poll = JSON.parse(new TextDecoder().decode(plaintext));
			expect(poll.credential_response_encryption).toBeDefined();
			expect(poll.credential_response_encryption.zip).toBeUndefined();
			const key = await importJWK(poll.credential_response_encryption.jwk, 'ECDH-ES');
			const data = await new CompactEncrypt(new TextEncoder().encode(JSON.stringify(payload)))
				.setProtectedHeader({ alg: 'ECDH-ES', enc: 'A256GCM' }).encrypt(key);
			return { status: 200, headers: { 'content-type': 'application/jwt' }, data };
		});
		expect((await builder.executeDeferredFetch('transaction')).credentialResponse.data).toEqual(payload);
	});

	it.each([true, false])('returns plaintext protocol errors when response encryption required is %s', async (required) => {
		const { builder, metadata } = await setup();
		metadata.credential_response_encryption.encryption_required = required;
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
	describe.each(['initial', 'deferred'] as const)('%s shared request handling', (mode) => {
		async function setupMode(requestEncryption = true, responseEncryption = true) {
			const context = await setup(requestEncryption, responseEncryption);
			if (mode === 'initial') context.builder.setCredentialEndpoint(issuer + '/credential');
			const send = () => mode === 'initial' ? context.builder.execute('example', 'jwt', ['cached-proof']) : context.builder.executeDeferredFetch('transaction');
			return { ...context, send };
		}

		it.each([200, 202])('rejects plaintext HTTP %s after requesting optional encryption', async (status) => {
			const { metadata, send } = await setupMode();
			metadata.credential_response_encryption.encryption_required = false;
			mocks.post.mockResolvedValue({ status, headers: { 'content-type': 'application/json' }, data: {} });
			await expect(send()).rejects.toThrow();
		});

		it.each([true, false])('encrypts without unsupported compression when required is %s', async (required) => {
			const { metadata, keys, send } = await setupMode();
			metadata.credential_request_encryption.encryption_required = required;
			metadata.credential_response_encryption.encryption_required = required;
			metadata.credential_request_encryption.zip_values_supported = ['unsupported'];
			metadata.credential_response_encryption.zip_values_supported = ['unsupported'];
			const payload = { credentials: [{ credential: 'issued' }] };
			mocks.post.mockImplementation(async (_url, body, headers) => {
				expect(headers['Content-Type']).toBe('application/jwt');
				const { plaintext, protectedHeader } = await compactDecrypt(body, keys.privateKey);
				expect(protectedHeader.kid).toBe('issuer-key');
				expect(protectedHeader.zip).toBeUndefined();
				const request = JSON.parse(new TextDecoder().decode(plaintext));
				expect(request.credential_response_encryption.zip).toBeUndefined();
				const key = await importJWK(request.credential_response_encryption.jwk, 'ECDH-ES');
				const data = await new CompactEncrypt(new TextEncoder().encode(JSON.stringify(payload)))
					.setProtectedHeader({ alg: 'ECDH-ES', enc: 'A256GCM' }).encrypt(key);
				return { status: 200, headers: { 'content-type': ' Application/JWT ; charset=utf-8' }, data };
			});
			expect((await send()).credentialResponse.data).toEqual(payload);
			expect(JSON.stringify(vi.mocked(console.log).mock.calls)).not.toMatch(/access-token|cached-proof|issued/);
		});

		it('preserves DEF compression for requests and responses', async () => {
			// jsdom's Blob does not implement stream(); use the native implementation.
			vi.stubGlobal('Blob', NodeBlob);
			const { metadata, keys, send } = await setupMode();
			metadata.credential_request_encryption.zip_values_supported = ['DEF'];
			metadata.credential_response_encryption.zip_values_supported = ['DEF'];
			const payload = { credentials: [{ credential: 'issued' }] };
			mocks.post.mockImplementation(async (_url, body) => {
				const { plaintext, protectedHeader } = await compactDecrypt(body, keys.privateKey, compressionOptions);
					expect(protectedHeader.zip).toBe('DEF');
				const request = JSON.parse(new TextDecoder().decode(plaintext));
				expect(request.credential_response_encryption.zip).toBe('DEF');
				const key = await importJWK(request.credential_response_encryption.jwk, 'ECDH-ES');
				const data = await new CompactEncrypt(new TextEncoder().encode(JSON.stringify(payload)))
					.setProtectedHeader({ alg: 'ECDH-ES', enc: 'A256GCM', zip: request.credential_response_encryption.zip }).encrypt(key, compressionOptions);
				return { status: 200, headers: { 'content-type': 'application/jwt' }, data };
			});
			expect((await send()).credentialResponse.data).toEqual(payload);
		});

		it('uses independent headers when switching to plaintext', async () => {
			const { metadata, send } = await setupMode(true, false);
			mocks.post.mockResolvedValue({ status: 200, headers: {}, data: {} });
			await send();
			const firstHeaders = mocks.post.mock.calls[0][2];
			delete metadata.credential_request_encryption;
			await send();
			expect(firstHeaders['Content-Type']).toBe('application/jwt');
			expect(mocks.post.mock.calls[1][2]['Content-Type']).toBe('application/json');
		});

		it('refreshes the DPoP proof on a nonce challenge', async () => {
			const { builder, keys, send } = await setupMode(false, false);
			builder.setDpopPublicKeyJwk(await exportJWK(keys.publicKey));
			builder.setDpopJti('jti');
			const { generateDPoP } = await import('../../utils/dpop');
			vi.mocked(generateDPoP).mockResolvedValueOnce('first-proof').mockResolvedValueOnce('retry-proof');
			await builder.setDpopHeader();
			mocks.post.mockResolvedValueOnce({ status: 401, headers: { 'www-authenticate': 'DPoP error="use_dpop_nonce"', 'dpop-nonce': 'nonce' }, data: {} })
				.mockResolvedValueOnce({ status: 200, headers: {}, data: { credentials: [{ credential: 'issued' }] } });
			expect((await send()).credentialResponse.status).toBe(200);
			expect(mocks.post.mock.calls[0][2].dpop).toBe('first-proof');
			expect(mocks.post.mock.calls[1][2].dpop).toBe('retry-proof');
			expect(vi.mocked(generateDPoP).mock.calls[1][4]).toBe('nonce');
		});
	});

	it('returns a persistent deferred nonce challenge after one retry', async () => {
		const { builder, keys } = await setup(false, false);
		builder.setDpopPublicKeyJwk(await exportJWK(keys.publicKey));
		builder.setDpopJti('jti');
		const { generateDPoP } = await import('../../utils/dpop');
		vi.mocked(generateDPoP).mockResolvedValue('proof');
		await builder.setDpopHeader();
		const response = { status: 401, headers: { 'www-authenticate': 'DPoP error="use_dpop_nonce"', 'dpop-nonce': 'nonce' }, data: {} };
		mocks.post.mockResolvedValue(response);
		expect((await builder.executeDeferredFetch('transaction')).credentialResponse).toEqual(response);
		expect(mocks.post).toHaveBeenCalledTimes(2);
	});

	it('preserves initial response encryption without request encryption', async () => {
		const { builder } = await setup(false, true);
		builder.setCredentialEndpoint(issuer + '/credential');
		mocks.post.mockImplementation(async (_url, body, headers) => {
			expect(headers['Content-Type']).toBe('application/json');
			expect(body.proofs).toEqual({ jwt: ['cached-proof'] });
			const key = await importJWK(body.credential_response_encryption.jwk, 'ECDH-ES');
			const data = await new CompactEncrypt(new TextEncoder().encode(JSON.stringify({ credentials: [{ credential: 'issued' }] })))
				.setProtectedHeader({ alg: 'ECDH-ES', enc: 'A256GCM' }).encrypt(key);
			return { status: 200, headers: { 'content-type': 'application/jwt' }, data };
		});
		expect((await builder.execute('example', 'jwt', ['cached-proof'])).credentialResponse.data.credentials).toEqual([{ credential: 'issued' }]);
	});

});
