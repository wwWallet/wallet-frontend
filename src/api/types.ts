export type UserData = {
	displayName: string;
	did: string;
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
