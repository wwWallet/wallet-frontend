// @vitest-environment node

import * as jose from 'jose';
import { describe, expect, it } from 'vitest';
import { assertAccessTokenDpopBinding } from './TokenRequest';

describe('access token DPoP binding', () => {
	it('accepts an opaque DPoP access token whose binding is enforced through introspection', async () => {
		const { publicKey } = await jose.generateKeyPair('ES256');
		const publicJwk = await jose.exportJWK(publicKey);

		await expect(assertAccessTokenDpopBinding('opaque-token', 'DPoP', publicJwk)).resolves.toBeUndefined();
	});

	it('accepts a DPoP JWT access token bound to the expected key', async () => {
		const { publicKey } = await jose.generateKeyPair('ES256');
		const publicJwk = await jose.exportJWK(publicKey);
		const jkt = await jose.calculateJwkThumbprint(publicJwk);
		const token = [
			jose.base64url.encode(JSON.stringify({ alg: 'none' })),
			jose.base64url.encode(JSON.stringify({ cnf: { jkt } })),
			'',
		].join('.');

		await expect(assertAccessTokenDpopBinding(token, 'DPoP', publicJwk)).resolves.toBeUndefined();
	});

	it('rejects a token whose cnf.jkt is not bound to the expected key', async () => {
		const { publicKey } = await jose.generateKeyPair('ES256');
		const publicJwk = await jose.exportJWK(publicKey);
		const token = [
			jose.base64url.encode(JSON.stringify({ alg: 'none' })),
			jose.base64url.encode(JSON.stringify({ cnf: { jkt: 'other' } })),
			'',
		].join('.');

		await expect(assertAccessTokenDpopBinding(token, 'DPoP', publicJwk)).rejects.toThrow(/cnf\.jkt/);
	});

	it('rejects an opaque access token returned with Bearer token type', async () => {
		const { publicKey } = await jose.generateKeyPair('ES256');
		const publicJwk = await jose.exportJWK(publicKey);

		await expect(assertAccessTokenDpopBinding('opaque-token', 'Bearer', publicJwk)).rejects.toThrow(/DPoP-bound/);
	});
});
