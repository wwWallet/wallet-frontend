import { useContext, useCallback, useMemo } from "react";
import { IOpenID4VCIClientStateRepository } from "../interfaces/IOpenID4VCIClientStateRepository";
import { OpenID4VCIClientState } from "../types/OpenID4VCIClientState";
import SessionContext from "@/context/SessionContext";

export function useOpenID4VCIClientStateRepository(): IOpenID4VCIClientStateRepository {

	const key = "openid4vci_client_state";
	const { api, isLoggedIn, keystore } = useContext(SessionContext);

	const data = localStorage.getItem(key);
	if (!data || !(JSON.parse(data) instanceof Array)) {
		localStorage.setItem(key, JSON.stringify([]));
	}

	const getRememberIssuerAge = useCallback(async (): Promise<number | null> => {
		if (!api || !isLoggedIn) {
			return null;
		}
		return api.get('/user/session/account-info').then((response) => {
			const userData = response.data;
			return userData.settings.openidRefreshTokenMaxAgeInSeconds as number;
		});
	}, [api, isLoggedIn]);

	const getByCredentialIssuerIdentifierAndCredentialConfigurationIdAndUserHandle = useCallback(async (
		credentialIssuer: string,
		credentialConfigurationId: string
	): Promise<OpenID4VCIClientState | null> => {

		const array = JSON.parse(localStorage.getItem(key)) as Array<OpenID4VCIClientState>;
		const res = array.filter((s) => s.credentialIssuerIdentifier === credentialIssuer && s.credentialConfigurationId === credentialConfigurationId && s.userHandleB64U === keystore.getUserHandleB64u())[0];
		return res ? res : null;
	},
		[keystore]
	);

	const getByStateAndUserHandle = useCallback(
		async (state: string): Promise<OpenID4VCIClientState | null> => {
			const array = JSON.parse(localStorage.getItem(key)) as Array<OpenID4VCIClientState>;
			const res = array.filter((s) => s.state === state && s.userHandleB64U === keystore.getUserHandleB64u())[0];
			return res ? res : null;
		},
		[keystore]
	);

	const cleanupExpired = useCallback(async (): Promise<void> => {
		const rememberIssuerForSeconds = await getRememberIssuerAge();
		if (rememberIssuerForSeconds == null) {
			return;
		}
		const array = JSON.parse(localStorage.getItem(key)) as Array<OpenID4VCIClientState>;
		const results = array.filter((s) => s.userHandleB64U === keystore.getUserHandleB64u());
		const statesToBeRemoved: string[] = [];
		for (const res of results) {
			if (res.created &&
				typeof res.created === 'number' &&
				Math.floor(Date.now() / 1000) > res.created + rememberIssuerForSeconds) {

				statesToBeRemoved.push(res.state);
			}
		}

		console.log("Cleanup states = ", statesToBeRemoved)
		const filteredArray = array.filter((s) => !statesToBeRemoved.includes(s.state));
		localStorage.setItem(key, JSON.stringify(filteredArray));
	}, [keystore, getRememberIssuerAge]);

	const create = useCallback(
		async (state: OpenID4VCIClientState): Promise<void> => {
			const existingState = await getByCredentialIssuerIdentifierAndCredentialConfigurationIdAndUserHandle(
				state.credentialIssuerIdentifier,
				state.credentialConfigurationId
			);

			const data = localStorage.getItem(key);
			const array = data ? (JSON.parse(data) as OpenID4VCIClientState[]) : [];

			if (existingState) {
				const updatedArray = array.filter(
					(x) => x.credentialConfigurationId !== state.credentialConfigurationId
				);
				localStorage.setItem(key, JSON.stringify(updatedArray));
			}

			array.push(state);
			localStorage.setItem(key, JSON.stringify(array));
		},
		[getByCredentialIssuerIdentifierAndCredentialConfigurationIdAndUserHandle]
	);

	const updateState = useCallback(
		async (newState: OpenID4VCIClientState): Promise<void> => {
			const fetched = await getByStateAndUserHandle(newState.state);
			if (!fetched) {
				return;
			}
			const array = JSON.parse(localStorage.getItem(key)) as Array<OpenID4VCIClientState>;
			const updatedArray = array.filter((x) => x.state !== newState.state); // remove the state that is going to be changed
			updatedArray.push(newState);
			// commit changes
			localStorage.setItem(key, JSON.stringify(updatedArray));
		},
		[getByStateAndUserHandle]
	);

	return useMemo(() => {
		return {
			getByCredentialIssuerIdentifierAndCredentialConfigurationIdAndUserHandle,
			getByStateAndUserHandle,
			cleanupExpired,
			create,
			updateState,
			getRememberIssuerAge,
		}
	}, [
		getByCredentialIssuerIdentifierAndCredentialConfigurationIdAndUserHandle,
		getByStateAndUserHandle,
		cleanupExpired,
		create,
		updateState,
		getRememberIssuerAge,
	]);
}
