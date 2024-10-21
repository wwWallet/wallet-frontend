import { IOpenID4VCIClientStateRepository } from "../interfaces/IOpenID4VCIClientStateRepository";
import { OpenID4VCIClientState } from "../types/OpenID4VCIClientState";


export class OpenID4VCIClientStateRepository implements IOpenID4VCIClientStateRepository {


	private key = "openid4vci_client_state";

	constructor() {
		if (!localStorage.getItem(this.key)) {
			localStorage.setItem(this.key, JSON.stringify([]));
		}
	}
	async getByState(state: string): Promise<OpenID4VCIClientState | null> {
		const array = JSON.parse(localStorage.getItem(this.key)) as Array<OpenID4VCIClientState>;
		const res = array.filter((s) => s.state == state)[0];
		return res ? res : null;
	}

	async getByCredentialConfigurationId(credentialConfigurationId: string): Promise<OpenID4VCIClientState | null> {
		const array = JSON.parse(localStorage.getItem(this.key)) as Array<OpenID4VCIClientState>;
		const res = array.filter((s) => s.credentialConfigurationId == credentialConfigurationId)[0]
		return res ? res : null;
	}

	async create(s: OpenID4VCIClientState): Promise<void> {
		const existingState = await this.getByCredentialConfigurationId(s.credentialConfigurationId);
		if (existingState) { // remove the existing state for this configuration id
			const array = JSON.parse(localStorage.getItem(this.key)) as Array<OpenID4VCIClientState>;
			const updatedArray = array.filter((x) => x.credentialConfigurationId != s.credentialConfigurationId);
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

	async updateState(newState: OpenID4VCIClientState): Promise<void> {
		const fetched = await this.getByState(newState.state);
		if (!fetched) {
			return;
		}
		const array = JSON.parse(localStorage.getItem(this.key)) as Array<OpenID4VCIClientState>;
		const updatedArray = array.filter((x) => x.state != newState.state); // remove the state that is going to be changed
		updatedArray.push(newState);
		// commit changes
		localStorage.setItem(this.key, JSON.stringify(updatedArray));
	}

}
