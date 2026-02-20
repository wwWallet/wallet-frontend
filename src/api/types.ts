export type Verifier = {
	id: number;
	name: string;
	url: string;
}

// UserHandle constants - must match go-wallet-backend/internal/domain/tenant.go
const USER_HANDLE_V1_LENGTH = 25;  // 1 (version) + 8 (tenant hash) + 16 (UUID)
const USER_HANDLE_VERSION_1 = 0x01;

// Convert 16 raw UUID bytes to UUID string format
function uuidBytesToString(bytes: Uint8Array): string {
	const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
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
		const bytes = userHandle instanceof ArrayBuffer
			? new Uint8Array(userHandle)
			: new Uint8Array((userHandle as ArrayBufferView).buffer, (userHandle as ArrayBufferView).byteOffset, (userHandle as ArrayBufferView).byteLength);

		// Check for v1 binary format: 25 bytes, first byte = 0x01
		if (bytes.length === USER_HANDLE_V1_LENGTH && bytes[0] === USER_HANDLE_VERSION_1) {
			// Extract UUID bytes (bytes 9-25) and convert to UUID string
			const uuidBytes = bytes.slice(9, 25);
			return new UserId(uuidBytesToString(uuidBytes));
		}

		// Legacy string format
		return new UserId(new TextDecoder().decode(bytes));
	}

	public asUserHandle(): Uint8Array {
		return new TextEncoder().encode(this.id);
	}
}

export type UserData = {
	uuid: string;
	displayName: string;
	webauthnCredentials: WebauthnCredential[];
	privateData: Uint8Array;
	settings: UserSettings;
}

export type WebauthnCredential = {
	createTime: string,
	credentialId: Uint8Array,
	id: string,
	lastUseTime: string,
	nickname?: string,
	prfCapable: boolean,
}

export type UserSettings = {
	openidRefreshTokenMaxAgeInSeconds: number;
	useOblivious: string;
}
