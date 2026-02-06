import { JWK } from "jose";
import { DcqlQueryType } from "./dcqlQuery.type";
import * as z from 'zod';

export enum ResponseMode {
	DIRECT_POST = 'direct_post',
	DIRECT_POST_JWT = 'direct_post.jwt',
	DC_API = 'dc_api',
	DC_API_JWT = 'dc_api.jwt',
}

export const ResponseModeSchema = z.nativeEnum(ResponseMode);

type ClientMetadata = {
	jwks?: { keys: JWK[] };
	jwks_uri?: string;
	authorization_encrypted_response_alg?: string;
	authorization_encrypted_response_enc?: string;
	vp_formats: any;
}
/**
 * serializable
 */
export class OpenID4VPRelyingPartyState {

	constructor(
		public nonce: string,
		public response_uri: string,
		public client_id: string,
		public state: string,
		public client_metadata: ClientMetadata,
		public response_mode: ResponseMode,
		public transaction_data: string[],
		public dcql_query: DcqlQueryType
	) { }

	public serialize(): string {
		return JSON.stringify({
			nonce: this.nonce,
			response_uri: this.response_uri,
			client_id: this.client_id,
			state: this.state,
			client_metadata: this.client_metadata,
			response_mode: this.response_mode,
			transaction_data: this.transaction_data,
			dcql_query: this.dcql_query
		});
	}

	public static deserialize(storedValue: string): OpenID4VPRelyingPartyState {
		const { nonce, response_uri, client_id, state, client_metadata, response_mode, transaction_data, dcql_query } = JSON.parse(storedValue) as OpenID4VPRelyingPartyState;
		return new OpenID4VPRelyingPartyState( nonce, response_uri, client_id, state, client_metadata, response_mode, transaction_data, dcql_query);
	}
}
