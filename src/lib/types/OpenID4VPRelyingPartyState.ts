import { PresentationDefinitionType } from "./presentationDefinition.type";

/**
 * serializable
 */
export class OpenID4VPRelyingPartyState {

	constructor(
		public presentation_definition: PresentationDefinitionType,
		public nonce: string,
		public response_uri: string,
		public client_id: string,
		public state: string,
	) { }

	public serialize(): string {
		return JSON.stringify({
			presentation_definition: this.presentation_definition,
			nonce: this.nonce,
			response_uri: this.response_uri,
			client_id: this.client_id,
			state: this.state,
		});
	}

	public static deserialize(storedValue: string): OpenID4VPRelyingPartyState {
		const { presentation_definition, nonce, response_uri, client_id, state } = JSON.parse(storedValue) as OpenID4VPRelyingPartyState;
		return new OpenID4VPRelyingPartyState(presentation_definition, nonce, response_uri, client_id, state);
	}
}
