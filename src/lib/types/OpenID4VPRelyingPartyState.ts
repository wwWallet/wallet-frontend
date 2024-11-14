import { JWK } from "jose";
import { PresentationDefinitionType } from "./presentationDefinition.type";
import * as z from 'zod';

export enum ResponseMode {
	DIRECT_POST = 'direct_post',
	DIRECT_POST_JWT = 'direct_post.jwt',
}

export const ResponseModeSchema = z.nativeEnum(ResponseMode);

type ClientMetadata = {
	jwks?: { keys: JWK[] },
	authorization_encrypted_response_alg?: string;
	authorization_encrypted_response_enc?: string;
	vp_formats: any;
}
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
		public client_metadata: ClientMetadata,
		public response_mode: ResponseMode,
	) { }

	public serialize(): string {
		return JSON.stringify({
			presentation_definition: this.presentation_definition,
			nonce: this.nonce,
			response_uri: this.response_uri,
			client_id: this.client_id,
			state: this.state,
			client_metadata: this.client_metadata,
			response_mode: this.response_mode,
		});
	}

	public static deserialize(storedValue: string): OpenID4VPRelyingPartyState {
		const { presentation_definition, nonce, response_uri, client_id, state, client_metadata, response_mode } = JSON.parse(storedValue) as OpenID4VPRelyingPartyState;
		return new OpenID4VPRelyingPartyState(presentation_definition, nonce, response_uri, client_id, state, client_metadata, response_mode);
	}
}
