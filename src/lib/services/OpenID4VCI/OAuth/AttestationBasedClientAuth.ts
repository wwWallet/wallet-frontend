import * as oauth4webapi from 'oauth4webapi';
import { getOpenID4VCIProfile } from '../profiles';

export interface AttestationBasedClientAuthOptions extends oauth4webapi.ModifyAssertionOptions {
	challenge?: string;
}

/**
 * Implements attest_jwt_client_auth using a key bound in the attestation's cnf.jwk.
 * Each invocation signs a fresh proof. Challenges are supplied by the caller.
 *
 * The ClientAuth callback follows the oauth4webapi PrivateKeyJwt API pattern.
 * @see https://github.com/panva/oauth4webapi/blob/main/src/index.ts
 * @see https://www.ietf.org/archive/id/draft-ietf-oauth-attestation-based-client-auth-12.html#section-5.1
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
	const signAssertion = oauth4webapi.PrivateKeyJwt(clientPrivateKey, {
		[oauth4webapi.modifyAssertion]: (header, payload) => {
			header.typ = 'oauth-client-attestation-pop+jwt';

			// Keep the signer-generated audience, timestamp, and unique ID.
			// Rebuild the remaining claims for attestation PoP.
			// This drops sub, exp, nbf and future additions to oauth4webapi
			const { aud, iat, iss, jti } = payload;
			if (typeof iss !== 'string' || !iss.length) {
				throw new TypeError('client_id must be a non-empty string');
			}
			for (const claim of Object.keys(payload)) {
				delete payload[claim];
			}
			Object.assign(payload, getOpenID4VCIProfile().clientAttestationProofClaims(iss), { aud, iat, jti });
			if (options?.challenge) {
				payload.challenge = options.challenge;
			}
			options?.[oauth4webapi.modifyAssertion]?.(header, payload);
		},
	});

	return async (as, client, body, headers) => {
		if (
			headers.has('authorization') ||
			body.has('client_secret') ||
			body.has('client_assertion') ||
			body.has('client_assertion_type')
		) {
			throw new TypeError(
				'Attestation-based client authentication cannot be combined with another authentication mechanism',
			);
		}
		// The signer writes private_key_jwt fields to this temporary form.
		const assertion = new URLSearchParams();
		await signAssertion(as, client, assertion, headers);
		const proof = assertion.get('client_assertion');
		if (typeof proof !== 'string' || !proof.length) {
			throw new Error('PrivateKeyJwt did not produce a client assertion');
		}
		body.set('client_id', client.client_id);
		headers.set('OAuth-Client-Attestation', clientAttestation);
		headers.set('OAuth-Client-Attestation-PoP', proof);
	};
}
