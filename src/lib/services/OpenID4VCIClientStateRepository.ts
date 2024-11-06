import { IOpenID4VCIClientStateRepository } from "../interfaces/IOpenID4VCIClientStateRepository";
import { OpenID4VCIClientState } from "../types/OpenID4VCIClientState";


export class OpenID4VCIClientStateRepository implements IOpenID4VCIClientStateRepository {


	private key = "openid4vci_client_state";

	constructor(private refreshTokenMaxAgeInSeconds: number) {
		const data = localStorage.getItem(this.key);
		if (!data || !(JSON.parse(data) instanceof Array)) {
			localStorage.setItem(this.key, JSON.stringify([]));
		}
	}
	async getByStateAndUserHandle(state: string, userHandleB64U: string): Promise<OpenID4VCIClientState | null> {
		const array = JSON.parse(localStorage.getItem(this.key)) as Array<OpenID4VCIClientState>;
		const res = array.filter((s) => s.state === state && s.userHandleB64U === userHandleB64U)[0];
		if (res &&
			(
				!res.created ||
				typeof res.created !== 'number' ||
				(
					res.tokenResponse?.data?.refresh_token &&
					Math.floor(Date.now() / 1000) - res.created > this.refreshTokenMaxAgeInSeconds
				)
			)
		) {
			const updatedArray = array.filter((x) => x.state !== res.state); // remove the state
			localStorage.setItem(this.key, JSON.stringify(updatedArray));
			return null;
		}
		return res ? res : null;
	}

	async getByCredentialConfigurationIdAndUserHandle(credentialConfigurationId: string, userHandleB64U: string): Promise<OpenID4VCIClientState | null> {
		const array = JSON.parse(localStorage.getItem(this.key)) as Array<OpenID4VCIClientState>;
		const res = array.filter((s) => s.credentialConfigurationId === credentialConfigurationId && s.userHandleB64U === userHandleB64U)[0];
		if (res &&
			(
				!res.created ||
				typeof res.created != 'number' ||
				(
					res.tokenResponse?.data?.refresh_token &&
					Math.floor(Date.now() / 1000) - res.created > this.refreshTokenMaxAgeInSeconds
				)
			)
		) {
			const updatedArray = array.filter((x) => x.state !== res.state); // remove the state
			localStorage.setItem(this.key, JSON.stringify(updatedArray));
			return null;
		}
		return res ? res : null;
	}

	async create(s: OpenID4VCIClientState): Promise<void> {
		const existingState = await this.getByCredentialConfigurationIdAndUserHandle(s.credentialConfigurationId, s.userHandleB64U);
		if (existingState) { // remove the existing state for this configuration id
			const array = JSON.parse(localStorage.getItem(this.key)) as Array<OpenID4VCIClientState>;
			const updatedArray = array.filter((x) => x.credentialConfigurationId !== s.credentialConfigurationId);
			localStorage.setItem(this.key, JSON.stringify(updatedArray));
		}
		let data = localStorage.getItem(this.key);
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
		catch(err) { // if parsing failed
			array = []; // then clean up the array with no elements
		}
		array.push(s);
		localStorage.setItem(this.key, JSON.stringify(array));
	}

	async updateState(newState: OpenID4VCIClientState, userHandleB64U: string): Promise<void> {
		const fetched = await this.getByStateAndUserHandle(newState.state, userHandleB64U);
		if (!fetched) {
			return;
		}
		const array = JSON.parse(localStorage.getItem(this.key)) as Array<OpenID4VCIClientState>;
		const updatedArray = array.filter((x) => x.state !== newState.state); // remove the state that is going to be changed
		updatedArray.push(newState);
		// commit changes
		localStorage.setItem(this.key, JSON.stringify(updatedArray));
	}

}
