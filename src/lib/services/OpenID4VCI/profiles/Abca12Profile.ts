import { DefaultProfile } from './DefaultProfile';
import type { OpenID4VCIProfile } from './types';

export const Abca12Profile: OpenID4VCIProfile = {
	...DefaultProfile,
	// Draft-08 removed iss from the Client Attestation PoP JWT. Draft-12 retains that change.
	clientAttestationProofClaims: () => ({}),
};
