import { OpenID4VPRelyingPartyState } from "../types/OpenID4VPRelyingPartyState";

export interface IOpenID4VPRelyingPartyStateRepository {
	store(stateObject: OpenID4VPRelyingPartyState): Promise<void>;
	retrieve(): Promise<OpenID4VPRelyingPartyState>;
}
