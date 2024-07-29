export type Verifier = {
	id: number;
	name: string;
	url: string;
	scopes: {
		name: string;
		description: string;
	}[];
}
export type UserData = {
	id: number;
	displayName: string;
	did: string;
	publicKey: JsonWebKey;
	webauthnUserHandle: string;
	webauthnCredentials: WebauthnCredential[];
	privateData: Uint8Array;
	webauthnRpId: string,
}

export type WebauthnCredential = {
	createTime: string,
	credentialId: Uint8Array,
	id: string,
	lastUseTime: string,
	nickname?: string,
	prfCapable: boolean,
}
