import type { OpenID4VCIProfile } from './types';

export const WeBuildProfile: OpenID4VCIProfile = {
	// The WE BUILD integration uses the OAuth attestation draft-12 proof claims.
	clientAttestationProofClaims: () => ({}),
	// CS-04 section 7.3 uses one proof signed by attested_keys[0].
	selectAttestedProofKeys: (keypairs, attestedKeys) => ({
		keypairs: keypairs.slice(0, 1),
		attestedKeys: attestedKeys.slice(0, 1),
	}),
};
