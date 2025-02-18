import { useCallback, useMemo } from "react";
import { IOpenID4VPRelyingPartyStateRepository } from "../interfaces/IOpenID4VPRelyingPartyStateRepository";
import { OpenID4VPRelyingPartyState } from "../types/OpenID4VPRelyingPartyState";

export function useOpenID4VPRelyingPartyStateRepository(): IOpenID4VPRelyingPartyStateRepository {
	const key = "openid4vp_rp_state";

	const store = useCallback(async (s: OpenID4VPRelyingPartyState): Promise<void> => {
		const x = s.serialize();
		localStorage.setItem(key, x);
	}, [key]);

	const retrieve = useCallback(async (): Promise<OpenID4VPRelyingPartyState> => {
		const serializedState = localStorage.getItem(key);
		if (!serializedState) {
			throw new Error("No state found in localStorage");
		}
		return OpenID4VPRelyingPartyState.deserialize(serializedState);
	}, [key]);

	return useMemo(() => {
		return {
			store,
			retrieve
		}
	}, [
		store,
		retrieve
	]);
}
