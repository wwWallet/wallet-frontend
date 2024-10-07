import { OpenID4VCIClientState } from "../types/OpenID4VCIClientState";

export interface IOpenID4VCIClientStateRepository {
	store(stateObject: OpenID4VCIClientState): Promise<void>;
	retrieve(): Promise<OpenID4VCIClientState>;
}
