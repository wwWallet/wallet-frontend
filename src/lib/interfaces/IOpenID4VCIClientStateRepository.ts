import { OpenID4VCIClientState } from "../types/OpenID4VCIClientState";

export interface IOpenID4VCIClientStateRepository {
	getByState(state: string): Promise<OpenID4VCIClientState | null>;
	create(s: OpenID4VCIClientState): Promise<void>;
	updateState(s: OpenID4VCIClientState): Promise<void>;
}
