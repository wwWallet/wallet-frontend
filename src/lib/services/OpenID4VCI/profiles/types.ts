import type { JWK } from 'jose';
import type { OpenidAuthorizationServerMetadata } from 'wallet-common';
import type { CredentialKeyPair } from '@/services/keystore';

type CredentialProofTypes = {
	jwt?: { key_attestations_required?: unknown };
	attestation?: unknown;
};

type AttestedProofKeys = { keypairs: CredentialKeyPair[]; attestedKeys: JWK[] };

export interface OpenID4VCIProfile {
	resolvePreAuthorizedTokenPolicy(metadata: OpenidAuthorizationServerMetadata): {
		clientAuthentication: 'anonymous' | 'attestation';
		useDpop: boolean;
	};
	attestationLifecycle?: {
		checkWalletAttestation(token: string, period?: number): void;
		checkKeyAttestation(token: string, period?: number): void;
	};
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
