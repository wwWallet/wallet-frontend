import { calculateJwkThumbprint } from 'jose';
import type { OpenID4VCIProfile } from './types';

export const WeBuildProfile: OpenID4VCIProfile = {
	// The WE BUILD integration uses the OAuth attestation draft-12 proof claims.
	clientAttestationProofClaims: () => ({}),
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
