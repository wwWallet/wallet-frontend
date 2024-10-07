import { IOpenID4VCIClientStateRepository } from "../interfaces/IOpenID4VCIClientStateRepository";
import { OpenID4VCIClientState } from "../types/OpenID4VCIClientState";


export class OpenID4VCIClientStateRepository implements IOpenID4VCIClientStateRepository {

	private key = "openid4vci_client_state";

	async store(s: OpenID4VCIClientState): Promise<void> {
		const x = s.serialize();
		localStorage.setItem(this.key, x);
	}

	async retrieve(): Promise<OpenID4VCIClientState> {
		return OpenID4VCIClientState.deserialize(localStorage.getItem(this.key))
	}

}
