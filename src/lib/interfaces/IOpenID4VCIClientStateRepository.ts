import { CurrentSchema } from "@/services/WalletStateSchema";

type WalletStateCredentialIssuanceSession = CurrentSchema.WalletStateCredentialIssuanceSession;

export interface IOpenID4VCIClientStateRepository {
	isInitialized(): boolean;
	getByState(state: string): Promise<WalletStateCredentialIssuanceSession | null>;
	getByCredentialIssuerIdentifierAndCredentialConfigurationId(credentialIssuerIdentifier: string, credentialConfigurationId: string): Promise<WalletStateCredentialIssuanceSession | null>;
	create(s: WalletStateCredentialIssuanceSession): Promise<void>;
	updateState(s: WalletStateCredentialIssuanceSession): Promise<void>;
	getAllStatesWithNonEmptyTransactionId(): Promise<WalletStateCredentialIssuanceSession[]>;
	cleanupExpired(): Promise<number[]>;
	commitStateChanges(): Promise<void>;
}
