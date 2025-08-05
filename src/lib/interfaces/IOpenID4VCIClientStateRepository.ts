import { WalletBaseStateCredentialIssuanceSession } from "@/services/WalletStateOperations";

export interface IOpenID4VCIClientStateRepository {
	getByState(state: string): Promise<WalletBaseStateCredentialIssuanceSession | null>;
	getByCredentialIssuerIdentifierAndCredentialConfigurationId(credentialIssuerIdentifier: string, credentialConfigurationId: string): Promise<WalletBaseStateCredentialIssuanceSession | null>;
	create(s: WalletBaseStateCredentialIssuanceSession): Promise<void>;
	updateState(s: WalletBaseStateCredentialIssuanceSession): Promise<void>;
	cleanupExpired(): Promise<void>;
	commitStateChanges(): Promise<void>;
}
