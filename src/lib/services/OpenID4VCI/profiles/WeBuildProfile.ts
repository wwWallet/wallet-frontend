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
