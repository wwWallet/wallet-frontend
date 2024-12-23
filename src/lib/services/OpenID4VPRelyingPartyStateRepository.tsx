import { IOpenID4VPRelyingPartyStateRepository } from "../interfaces/IOpenID4VPRelyingPartyStateRepository";
import { OpenID4VPRelyingPartyState } from "../types/OpenID4VPRelyingPartyState";


export function useOpenID4VPRelyingPartyStateRepository(): IOpenID4VPRelyingPartyStateRepository {

	const key = "openid4vp_rp_state";

	return {
		async store(s: OpenID4VPRelyingPartyState): Promise<void> {
			const x = s.serialize();
			localStorage.setItem(key, x);
		},

		async retrieve(): Promise<OpenID4VPRelyingPartyState> {
			return OpenID4VPRelyingPartyState.deserialize(localStorage.getItem(key))
		}
	}
}
