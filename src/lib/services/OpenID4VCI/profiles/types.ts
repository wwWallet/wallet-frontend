import type { JWK } from 'jose';
import type { CredentialKeyPair } from '@/services/keystore';

export interface OpenID4VCIProfile {
	clientAttestationProofClaims(clientId: string): { iss?: string };
	selectAttestedProofKeys(
		keypairs: CredentialKeyPair[],
		attestedKeys: JWK[],
	): { keypairs: CredentialKeyPair[]; attestedKeys: JWK[] };
}
