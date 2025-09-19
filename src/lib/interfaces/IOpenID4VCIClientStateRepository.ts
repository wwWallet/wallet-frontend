import { WalletStateCredentialIssuanceSession } from "@/services/WalletStateOperations";

export interface IOpenID4VCIClientStateRepository {
	getByState(state: string): Promise<WalletStateCredentialIssuanceSession | null>;
	getByCredentialIssuerIdentifierAndCredentialConfigurationId(credentialIssuerIdentifier: string, credentialConfigurationId: string): Promise<WalletStateCredentialIssuanceSession | null>;
	create(s: WalletStateCredentialIssuanceSession): Promise<void>;
	updateState(s: WalletStateCredentialIssuanceSession): Promise<void>;
	getAllStatesWithNonEmptyTransactionId(): Promise<WalletStateCredentialIssuanceSession[]>;
	cleanupExpired(): Promise<void>;
	commitStateChanges(): Promise<void>;
}
