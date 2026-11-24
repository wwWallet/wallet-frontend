import type { JWK } from 'jose';
import type { CredentialKeyPair } from '@/services/keystore';

type CredentialProofTypes = {
	jwt?: { key_attestations_required?: unknown };
	attestation?: unknown;
};

type AttestedProofKeys = { keypairs: CredentialKeyPair[]; attestedKeys: JWK[] };

export interface OpenID4VCIProfile {
	selectCredentialProof(
		advertised: CredentialProofTypes | undefined,
		precedence: readonly string[],
	): { proofType: 'jwt' | 'attestation'; keyAttestationRequired: boolean };
	clientAttestationProofClaims(clientId: string): { iss?: string };
	selectAttestedProofKeys(
		keypairs: CredentialKeyPair[],
		attestedKeys: JWK[],
	): AttestedProofKeys | Promise<AttestedProofKeys>;
}
