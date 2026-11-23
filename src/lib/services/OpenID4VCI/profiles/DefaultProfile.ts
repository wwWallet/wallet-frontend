import type { OpenID4VCIProfile } from './types';

export const DefaultProfile: OpenID4VCIProfile = {
	// OpenID4VCI 1.0 Appendix E references OAuth attestation draft-07.
	clientAttestationProofClaims: (clientId) => ({ iss: clientId }),
	selectAttestedProofKeys: (keypairs, attestedKeys) => ({ keypairs, attestedKeys }),
};
