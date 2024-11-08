import { OpenID4VCIClientState } from "../types/OpenID4VCIClientState";

export interface IOpenID4VCIClientStateRepository {
	getByStateAndUserHandle(state: string, userHandleB64U: string): Promise<OpenID4VCIClientState | null>;
	getByCredentialConfigurationIdAndUserHandle(credentialConfigurationId: string, userHandleB64U: string): Promise<OpenID4VCIClientState | null>;
	create(s: OpenID4VCIClientState): Promise<void>;
	updateState(s: OpenID4VCIClientState, userHandleB64U: string): Promise<void>;
	cleanupExpired(userHandleB64U: string): Promise<void>;
}
