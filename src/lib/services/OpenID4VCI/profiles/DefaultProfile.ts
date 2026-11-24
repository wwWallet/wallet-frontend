import type { OpenID4VCIProfile } from './types';

export const DefaultProfile: OpenID4VCIProfile = {
	// OpenID4VCI 1.0 Appendix E references OAuth attestation draft-07.
	clientAttestationProofClaims: (clientId) => ({ iss: clientId }),
	selectCredentialProof: (advertised, precedence) => {
		const preferredProof = precedence.find((type) => {
			if (type === 'jwt') return Boolean(advertised?.jwt);
			if (type === 'attestation') return Boolean(advertised?.attestation);
			return false;
		});
		const proofType = preferredProof === 'attestation' ? 'attestation' : 'jwt';
		return {
			proofType,
			keyAttestationRequired: proofType === 'attestation' || advertised?.jwt?.key_attestations_required != null,
		};
	},
	selectAttestedProofKeys: (keypairs, attestedKeys) => ({ keypairs, attestedKeys }),
};
