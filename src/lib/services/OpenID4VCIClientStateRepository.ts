import { IOpenID4VCIClientStateRepository } from "../interfaces/IOpenID4VCIClientStateRepository";
import { OpenID4VCIClientState } from "../types/OpenID4VCIClientState";


export class OpenID4VCIClientStateRepository implements IOpenID4VCIClientStateRepository {

	private key = "openid4vci_client_state";

	async getByState(state: string): Promise<OpenID4VCIClientState | null> {
		const array = JSON.parse(localStorage.getItem(this.key)) as Array<OpenID4VCIClientState>;
		const res = array.filter((s) => s.state == state)[0];
		return res ? res : null;
	}

	async create(s: OpenID4VCIClientState): Promise<void> {
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

	async updateState(s: OpenID4VCIClientState): Promise<void> {
		const fetched = await this.getByState(s.state);
		if (!fetched) {
			return;
		}
		const array = JSON.parse(localStorage.getItem(this.key)) as Array<OpenID4VCIClientState>;
		const updatedArray = array.filter((x) => x.state != s.state); // remove the state that is going to be changed
		updatedArray.push(fetched);
		// commit changes
		localStorage.setItem(this.key, JSON.stringify(updatedArray));
	}

}
