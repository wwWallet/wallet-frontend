import { OpenID4VCIClientState } from "../types/OpenID4VCIClientState";

export interface IOpenID4VCIClientStateRepository {
	getByStateAndUserHandle(state: string): Promise<OpenID4VCIClientState | null>;
	getByCredentialIssuerIdentifierAndCredentialConfigurationIdAndUserHandle(credentialIssuerIdentifier: string, credentialConfigurationId: string): Promise<OpenID4VCIClientState | null>;
	create(s: OpenID4VCIClientState): Promise<void>;
	updateState(s: OpenID4VCIClientState): Promise<void>;
	cleanupExpired(): Promise<void>;
}
