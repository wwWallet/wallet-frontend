import { IOpenID4VPRelyingPartyStateRepository } from "../interfaces/IOpenID4VPRelyingPartyStateRepository";
import { OpenID4VPRelyingPartyState } from "../types/OpenID4VPRelyingPartyState";


export class OpenID4VPRelyingPartyStateRepository implements IOpenID4VPRelyingPartyStateRepository {

	private key = "openid4vp_rp_state";

	async store(s: OpenID4VPRelyingPartyState): Promise<void> {
		const x = s.serialize();
		localStorage.setItem(this.key, x);
	}

	async retrieve(): Promise<OpenID4VPRelyingPartyState> {
		return OpenID4VPRelyingPartyState.deserialize(localStorage.getItem(this.key))
	}

}
