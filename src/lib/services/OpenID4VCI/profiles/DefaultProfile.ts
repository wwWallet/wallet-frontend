import type { OpenID4VCIProfile } from './types';

export const DefaultProfile: OpenID4VCIProfile = {
	resolvePreAuthorizedTokenPolicy: (metadata) => ({
		clientAuthentication:
			metadata.token_endpoint_auth_methods_supported?.includes('attest_jwt_client_auth') &&
			metadata['pre-authorized_grant_anonymous_access_supported'] !== true
				? 'attestation'
				: 'anonymous',
		useDpop: metadata.dpop_signing_alg_values_supported?.includes('ES256') ?? false,
	}),
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
