import { calculateJwkThumbprint, decodeJwt } from 'jose';
import type { OpenID4VCIProfile } from './types';

const minimumStatusPeriod = 31 * 24 * 60 * 60;

function checkAttestation(
	token: string,
	statusClaim: 'client_status' | 'key_storage_status',
	period = minimumStatusPeriod,
) {
	const { exp, [statusClaim]: status } = decodeJwt(token);
	const now = Math.floor(Date.now() / 1000);
	if (typeof exp !== 'number' || !Number.isFinite(exp) || exp <= now) {
		throw new Error('WE BUILD attestation is expired or missing a valid exp claim');
	}
	const statusExpiry = (status as { exp?: unknown } | undefined)?.exp;
	if (typeof statusExpiry !== 'number' || !Number.isSafeInteger(statusExpiry) || statusExpiry - now < period) {
		throw new Error(`WE BUILD attestation has insufficient ${statusClaim} maintenance remaining`);
	}
}

export const WeBuildProfile: OpenID4VCIProfile = {
	resolvePreAuthorizedTokenPolicy: (metadata) => {
		if (!metadata.token_endpoint_auth_methods_supported?.includes('attest_jwt_client_auth')) {
			throw new Error('The authorization server does not support standalone client attestation');
		}
		if (!metadata.dpop_signing_alg_values_supported?.includes('ES256')) {
			throw new Error('WE BUILD pre-authorized issuance requires ES256 DPoP');
		}
		return { clientAuthentication: 'attestation', useDpop: true };
	},
	// The WE BUILD integration uses the OAuth attestation draft-12 proof claims.
	clientAttestationProofClaims: () => ({}),
	attestationLifecycle: {
		checkWalletAttestation: (token, period) => checkAttestation(token, 'client_status', period),
		checkKeyAttestation: (token, period) => checkAttestation(token, 'key_storage_status', period),
	},
	selectCredentialProof: (advertised) => {
		if (!advertised?.jwt) {
			throw new Error('WEBUILD requires the issuer to advertise the jwt credential proof type');
		}
		return { proofType: 'jwt', keyAttestationRequired: true };
	},
	// CS-04 section 7.3 uses one proof signed by attested_keys[0].
	selectAttestedProofKeys: async (keypairs, [attestedKey]) => {
		const thumbprint = await calculateJwkThumbprint(attestedKey);
		const generatedThumbprints = await Promise.all(keypairs.map(({ publicKey }) => calculateJwkThumbprint(publicKey)));
		const keypair = keypairs[generatedThumbprints.indexOf(thumbprint)];
		if (!keypair) {
			throw new Error('The first attested key does not match a generated credential key');
		}
		return { keypairs: [keypair], attestedKeys: [attestedKey] };
	},
};
