import * as oauth4webapi from 'oauth4webapi';

function assertPrivateKey(key: unknown): asserts key is CryptoKey {
	if (!(key instanceof CryptoKey) || key.type !== 'private') {
		throw new TypeError('clientPrivateKey must be a private CryptoKey');
	}
	if (!key.usages.includes('sign')) {
		throw new TypeError('clientPrivateKey must permit signing');
	}
}

function assertString(value: unknown, name: string): asserts value is string {
	if (typeof value !== 'string' || !value.length) {
		throw new TypeError(`${name} must be a non-empty string`);
	}
}

function getKeyAndKid(input: CryptoKey | oauth4webapi.PrivateKey): oauth4webapi.PrivateKey {
	const { key, kid } = input instanceof CryptoKey ? { key: input, kid: undefined } : input;
	assertPrivateKey(key);
	if (kid !== undefined) assertString(kid, 'kid');
	return { key, kid };
}

function signingAlgorithm(key: CryptoKey): { alg: string; algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams } {
	const { name } = key.algorithm;
	if (name === 'ECDSA') {
		const curve = (key.algorithm as EcKeyAlgorithm).namedCurve;
		const bits = { 'P-256': 256, 'P-384': 384, 'P-521': 512 }[curve];
		if (bits) return { alg: `ES${bits}`, algorithm: { name, hash: `SHA-${bits}` } };
	}
	if (name === 'RSA-PSS' || name === 'RSASSA-PKCS1-v1_5') {
		const hash = (key.algorithm as RsaHashedKeyAlgorithm).hash.name;
		const bits = { 'SHA-256': 256, 'SHA-384': 384, 'SHA-512': 512 }[hash];
		if (bits) return {
			alg: `${name === 'RSA-PSS' ? 'PS' : 'RS'}${bits}`,
			algorithm: name === 'RSA-PSS' ? { name, saltLength: bits / 8 } : { name },
		};
	}
	if (name === 'Ed25519') return { alg: 'Ed25519', algorithm: { name } };
	throw new TypeError('Unsupported clientPrivateKey signing algorithm');
}

function base64url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export interface AttestationBasedClientAuthOptions extends oauth4webapi.ModifyAssertionOptions {
	challenge?: string;
}

/**
 * Applies attest_jwt_client_auth using a key bound in the attestation's cnf.jwk.
 * Each invocation signs a fresh proof. Challenges are supplied by the caller.
 * https://www.ietf.org/archive/id/draft-ietf-oauth-attestation-based-client-auth-11.html#section-5.1
 */
export function AttestationBasedClientAuth(
	clientPrivateKey: CryptoKey | oauth4webapi.PrivateKey,
	clientAttestation: string,
	options?: AttestationBasedClientAuthOptions,
): oauth4webapi.ClientAuth {
	if (typeof clientAttestation !== 'string' || !clientAttestation.length) {
		throw new TypeError('clientAttestation must be a non-empty string');
	}
	if (options?.challenge !== undefined && (typeof options.challenge !== 'string' || !options.challenge.length)) {
		throw new TypeError('challenge must be a non-empty string');
	}
	const { key, kid } = getKeyAndKid(clientPrivateKey);
	const { alg, algorithm } = signingAlgorithm(key);
	const encoder = new TextEncoder();
	const signProof = async (as: oauth4webapi.AuthorizationServer, client: oauth4webapi.Client): Promise<string> => {
		const skew = client[oauth4webapi.clockSkew];
		const header: Record<string, oauth4webapi.JsonValue | undefined> = {
			alg, kid, typ: 'oauth-client-attestation-pop+jwt',
		};
		const payload: Record<string, oauth4webapi.JsonValue | undefined> = {
			aud: as.issuer,
			iat: Math.floor(Date.now() / 1000) + (typeof skew === 'number' && Number.isFinite(skew) ? skew : 0),
			jti: oauth4webapi.generateRandomCodeVerifier(),
		};
		if (options) {
			if (options?.challenge) {
				payload.challenge = options.challenge;
			}

			if (options?.[oauth4webapi.modifyAssertion]) {
				options?.[oauth4webapi.modifyAssertion]?.(header, payload);
			}
		}

		const input = `${base64url(encoder.encode(JSON.stringify(header)))}.${base64url(encoder.encode(JSON.stringify(payload)))}`;
		const signature = await crypto.subtle.sign(algorithm, key, encoder.encode(input));
		return `${input}.${base64url(new Uint8Array(signature))}`;
	};

	return async (as, client, body, headers) => {
		if (headers.has('authorization') || body.has('client_secret') || body.has('client_assertion') || body.has('client_assertion_type')) {
			throw new TypeError('Attestation-based client authentication cannot be combined with another authentication mechanism');
		}
		const proof = await signProof(as, client);
		body.set('client_id', client.client_id);
		headers.set('OAuth-Client-Attestation', clientAttestation);
		headers.set('OAuth-Client-Attestation-PoP', proof);
	};
}
