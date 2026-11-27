import { DefaultProfile } from './DefaultProfile';
import type { OpenID4VCIProfile } from './types';

export const Abca12Profile: OpenID4VCIProfile = {
	...DefaultProfile,
	resolvePreAuthorizedTokenPolicy: (metadata) => {
		if (!metadata.token_endpoint_auth_methods_supported?.includes('attest_jwt_client_auth')) {
			throw new Error('The authorization server does not support standalone client attestation');
		}
		return {
			...DefaultProfile.resolvePreAuthorizedTokenPolicy(metadata),
			clientAuthentication: 'attestation',
		};
	},
	// Draft-08 removed iss from the Client Attestation PoP JWT. Draft-12 retains that change.
	clientAttestationProofClaims: () => ({}),
};
