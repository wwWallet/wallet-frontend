import { JWK } from "jose";

/**
 * serializable
 */
export class OpenID4VCIClientState {

	constructor(
		public userHandleB64U: string,
		public state: string,
		public code_verifier: string,
		public credentialConfigurationId: string,
		public tokenResponse?: {
			data: {
				access_token: string;
				expiration_timestamp: number;
				c_nonce: string;
				c_nonce_expiration_timestamp: number;
				refresh_token?: string;
			},
			headers: {
				"dpop-nonce"?: string;
			}
		},
		public dpop?: {
			dpopJti: string,
			dpopPrivateKeyJwk: JWK,
			dpopPublicKeyJwk?: JWK,
			dpopAlg: string,
		},
		public created: number = Math.floor(Date.now() / 1000),
	) { }

	public serialize(): string {
		return JSON.stringify({
			userHandleB64U: this.userHandleB64U,
			state: this.state,
			code_verifier: this.code_verifier,
			tokenResponse: this.tokenResponse,
			credentialConfigurationId: this.credentialConfigurationId,
			dpop: this.dpop,
			created: this.created,
		});
	}

	public static deserialize(storedValue: string): OpenID4VCIClientState {
		const { userHandleB64U, state, code_verifier, credentialConfigurationId, tokenResponse, dpop, created } = JSON.parse(storedValue);
		return new OpenID4VCIClientState(userHandleB64U, state, code_verifier, credentialConfigurationId, tokenResponse, dpop, created);
	}
}
