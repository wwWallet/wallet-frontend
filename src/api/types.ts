export type UserData = {
	username?: string;
	did: string;
	hasPassword: boolean;
	publicKey: JsonWebKey;
	webauthnUserHandle: string;
	webauthnCredentials: WebauthnCredential[];
}

export type WebauthnCredential = {
	createTime: string,
	credentialId: Uint8Array,
	id: string,
	lastUseTime: string,
	nickname?: string,
	prfCapable: boolean,
}
