import { useCallback, useMemo, useRef } from "react";
import { IOpenID4VPRelyingPartyStateRepository } from "../interfaces/IOpenID4VPRelyingPartyStateRepository";
import { OpenID4VPRelyingPartyState } from "../types/OpenID4VPRelyingPartyState";

export function useOpenID4VPRelyingPartyStateRepository(): IOpenID4VPRelyingPartyStateRepository {
	const state = useRef(null);

	const store = useCallback(async (s: OpenID4VPRelyingPartyState): Promise<void> => {
		state.current = s;
	}, []);

	const retrieve = useCallback(async (): Promise<OpenID4VPRelyingPartyState> => {
		const s = state.current;
		if (!s) {
			throw new Error("No state found in memory");
		}
		return state.current;
	}, []);

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
