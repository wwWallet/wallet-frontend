// @vitest-environment node
import { describe, expect, it } from 'vitest';
import * as oauth from 'oauth4webapi';
import * as jose from 'jose';
import { AttestationBasedClientAuth } from './AttestationBasedClientAuth';

const as = { issuer: 'https://as.example/' };
const client = { client_id: 'wallet' };

describe('AttestationBasedClientAuth', () => {
	it.each(['ES256', 'ES384', 'ES512', 'PS256', 'RS256'])('signs verifiable proofs using %s', async alg => {
		const { privateKey, publicKey } = await oauth.generateKeyPair(alg);
		const headers = new Headers();
		await AttestationBasedClientAuth(privateKey, 'attestation')(as, client, new URLSearchParams(), headers);
		const verified = await jose.jwtVerify(headers.get('OAuth-Client-Attestation-PoP')!, publicKey, {
			audience: as.issuer,
		});
		expect(verified.protectedHeader.alg).toBe(alg);
	});
	it('signs Ed25519 proofs with the fully specified algorithm identifier', async () => {
		const { privateKey, publicKey } = await oauth.generateKeyPair('Ed25519');
		const headers = new Headers();
		await AttestationBasedClientAuth(privateKey, 'attestation')(as, client, new URLSearchParams(), headers);
		// jose v4 predates the fully specified Ed25519 JOSE identifier.
		const token = headers.get('OAuth-Client-Attestation-PoP')!;
		const [header, payload, signature] = token.split('.');
		expect(jose.decodeProtectedHeader(token).alg).toBe('Ed25519');
		expect(await crypto.subtle.verify('Ed25519', publicKey, new Uint8Array(jose.base64url.decode(signature)), new TextEncoder().encode(`${header}.${payload}`))).toBe(true);
	});

	it('signs fresh proofs with the attested key and sends only ABCA authentication headers', async () => {
		const { privateKey, publicKey } = await oauth.generateKeyPair('ES256');
		const auth = AttestationBasedClientAuth({ key: privateKey, kid: 'instance' }, 'signed-attestation');
		const body = new URLSearchParams({ scope: 'openid' });
		const headers = new Headers();
		await auth(as, client, body, headers);
		const first = await jose.jwtVerify(headers.get('OAuth-Client-Attestation-PoP')!, publicKey, {
			audience: as.issuer, typ: 'oauth-client-attestation-pop+jwt',
		});
		expect(first.protectedHeader).toMatchObject({ alg: 'ES256', kid: 'instance' });
		expect(Object.keys(first.payload).sort()).toEqual(['aud', 'iat', 'jti']);
		expect(first.payload.iat).toBeTypeOf('number');
		expect(headers.get('OAuth-Client-Attestation')).toBe('signed-attestation');
		expect([...body.entries()]).toEqual([['scope', 'openid'], ['client_id', 'wallet']]);
		await auth(as, client, body, headers);
		expect(jose.decodeJwt(headers.get('OAuth-Client-Attestation-PoP')!).jti).not.toBe(first.payload.jti);
	});

	it('supports challenges, clock skew, and the library assertion customization hook', async () => {
		const { privateKey, publicKey } = await oauth.generateKeyPair('ES256');
		const headers = new Headers();
		await AttestationBasedClientAuth(privateKey, 'attestation', {
			challenge: 'server-challenge',
			[oauth.modifyAssertion]: (_header, payload) => { payload.extension = true; },
		})(as, { ...client, [oauth.clockSkew]: 30 }, new URLSearchParams(), headers);
		const { payload } = await jose.jwtVerify(headers.get('OAuth-Client-Attestation-PoP')!, publicKey);
		expect(payload).toMatchObject({ challenge: 'server-challenge', extension: true });
		expect(payload.iat).toBeGreaterThanOrEqual(Math.floor(Date.now() / 1000) + 29);
	});

	it('rejects missing attestations, empty challenges, and public keys', async () => {
		const { privateKey, publicKey } = await oauth.generateKeyPair('ES256');
		expect(() => AttestationBasedClientAuth(privateKey, '')).toThrow('clientAttestation');
		expect(() => AttestationBasedClientAuth(privateKey, 'attestation', { challenge: '' })).toThrow('challenge');
		expect(() => AttestationBasedClientAuth(publicKey, 'attestation')).toThrow();
	});

	it.each(['client_secret', 'client_assertion', 'client_assertion_type', 'authorization'])('rejects competing authentication via %s', async mechanism => {
		const { privateKey } = await oauth.generateKeyPair('ES256');
		const body = new URLSearchParams();
		const headers = new Headers();
		if (mechanism === 'authorization') headers.set(mechanism, 'Basic example');
		else body.set(mechanism, 'example');
		await expect(AttestationBasedClientAuth(privateKey, 'attestation')(as, client, body, headers)).rejects.toThrow('cannot be combined');
	});
});
