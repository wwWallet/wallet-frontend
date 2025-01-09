import { useContext, useEffect, useState } from "react";
import { IOpenID4VCIClientStateRepository } from "../interfaces/IOpenID4VCIClientStateRepository";
import { OpenID4VCIClientState } from "../types/OpenID4VCIClientState";
import SessionContext from "../../context/SessionContext";

export function useOpenID4VCIClientStateRepository(): IOpenID4VCIClientStateRepository {

	const key = "openid4vci_client_state";
	const [rememberIssuerForSeconds, setRememberIssuerForSeconds] = useState<number | null>(null);
	const { api, isLoggedIn, keystore } = useContext(SessionContext);

	const data = localStorage.getItem(key);
	if (!data || !(JSON.parse(data) instanceof Array)) {
		localStorage.setItem(key, JSON.stringify([]));
	}

	useEffect(() => {
		if (!api || !isLoggedIn) {
			return;
		}
		if (rememberIssuerForSeconds == null) {
			api.get('/user/session/account-info').then((response) => {
				const userData = response.data;
				setRememberIssuerForSeconds(userData.settings.openidRefreshTokenMaxAgeInSeconds);
			});
		}
	}, [api, isLoggedIn]);

	async function getByCredentialIssuerIdentifierAndCredentialConfigurationIdAndUserHandle(credentialIssuer: string, credentialConfigurationId: string): Promise<OpenID4VCIClientState | null> {
		const array = JSON.parse(localStorage.getItem(key)) as Array<OpenID4VCIClientState>;
		const res = array.filter((s) => s.credentialIssuerIdentifier === credentialIssuer && s.credentialConfigurationId === credentialConfigurationId && s.userHandleB64U === keystore.getUserHandleB64u())[0];
		return res ? res : null;
	}

	async function getByStateAndUserHandle(state: string): Promise<OpenID4VCIClientState | null> {
		const array = JSON.parse(localStorage.getItem(key)) as Array<OpenID4VCIClientState>;
		const res = array.filter((s) => s.state === state && s.userHandleB64U === keystore.getUserHandleB64u())[0];
		return res ? res : null;
	}

	return {
		getByCredentialIssuerIdentifierAndCredentialConfigurationIdAndUserHandle,
		getByStateAndUserHandle,

		async cleanupExpired() {
			if (rememberIssuerForSeconds == null) {
				return;
			}
			const array = JSON.parse(localStorage.getItem(key)) as Array<OpenID4VCIClientState>;
			const results = array.filter((s) => s.userHandleB64U === keystore.getUserHandleB64u());
			const statesToBeRemoved: string[] = [];
			for (const res of results) {
				if (!res.created ||
					typeof res.created !== 'number' ||
					Math.floor(Date.now() / 1000) - res.created > rememberIssuerForSeconds) {

					statesToBeRemoved.push(res.state);
				}
			}

			console.log("Cleanup states = ", statesToBeRemoved)
			const filteredArray = array.filter((s) => !statesToBeRemoved.includes(s.state));
			localStorage.setItem(key, JSON.stringify(filteredArray));
		},




		async create(s: OpenID4VCIClientState): Promise<void> {
			const existingState = await getByCredentialIssuerIdentifierAndCredentialConfigurationIdAndUserHandle(s.credentialIssuerIdentifier, s.credentialConfigurationId);
			if (existingState) { // remove the existing state for this configuration id
				const array = JSON.parse(localStorage.getItem(key)) as Array<OpenID4VCIClientState>;
				const updatedArray = array.filter((x) => x.credentialConfigurationId !== s.credentialConfigurationId);
				localStorage.setItem(key, JSON.stringify(updatedArray));
			}
			let data = localStorage.getItem(key);
			if (!data) {
				data = JSON.stringify('[]');
			}

			let array;
			try {
				array = JSON.parse(data) as Array<OpenID4VCIClientState>;
				if (!(array instanceof Array)) {
					throw new Error("Unable to parse as array")
				}
			}
			catch (err) { // if parsing failed
				array = []; // then clean up the array with no elements
			}
			array.push(s);
			localStorage.setItem(key, JSON.stringify(array));
		},

		async updateState(newState: OpenID4VCIClientState): Promise<void> {
			const fetched = await getByStateAndUserHandle(newState.state);
			if (!fetched) {
				return;
			}
			const array = JSON.parse(localStorage.getItem(key)) as Array<OpenID4VCIClientState>;
			const updatedArray = array.filter((x) => x.state !== newState.state); // remove the state that is going to be changed
			updatedArray.push(newState);
			// commit changes
			localStorage.setItem(key, JSON.stringify(updatedArray));
		}
	}
}
