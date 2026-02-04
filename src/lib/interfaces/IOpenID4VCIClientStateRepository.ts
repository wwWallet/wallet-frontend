import { CurrentSchema } from "@/services/WalletStateSchema";

export interface IOpenID4VCIClientStateRepository {
	getByState(state: string): Promise<CurrentSchema.WalletStateCredentialIssuanceSession | null>;
	getByCredentialIssuerIdentifierAndCredentialConfigurationId(credentialIssuerIdentifier: string, credentialConfigurationId: string): Promise<CurrentSchema.WalletStateCredentialIssuanceSession | null>;
	create(s: CurrentSchema.WalletStateCredentialIssuanceSession): Promise<void>;
	updateState(s: CurrentSchema.WalletStateCredentialIssuanceSession): Promise<void>;
	cleanupExpired(): Promise<void>;
	commitStateChanges(): Promise<void>;
}
