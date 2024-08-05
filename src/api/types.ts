export type Verifier = {
	id: number;
	name: string;
	url: string;
	scopes: {
		name: string;
		description: string;
	}[];
}

// Duplicated in wallet-backend-server
export class UserId {
	public readonly id: string;
	private constructor(id: string) {
		this.id = id;
	}

	public toString(): string {
		return `UserId(this.id)`;
	}

	static fromId(id: string): UserId {
		return new UserId(id);
	}

	static fromUserHandle(userHandle: BufferSource): UserId {
		return new UserId(new TextDecoder().decode(userHandle));
	}

	public asUserHandle(): Uint8Array {
		return new TextEncoder().encode(this.id);
	}
}

export type UserData = {
	uuid: string;
	displayName: string;
	did: string;
	publicKey: JsonWebKey;
	webauthnCredentials: WebauthnCredential[];
	privateData: Uint8Array;
}

export type WebauthnCredential = {
	createTime: string,
	credentialId: Uint8Array,
	id: string,
	lastUseTime: string,
	nickname?: string,
	prfCapable: boolean,
}
