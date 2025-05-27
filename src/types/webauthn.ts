export type PublicKeyCredentialCreation = PublicKeyCredential & { response: AuthenticatorAttestationResponse };
export type PublicKeyCredentialAssertion = PublicKeyCredential & { response: AuthenticatorAssertionResponse };

export interface AuthenticationExtensionsPRFInputs {
	eval?: AuthenticationExtensionsPRFValues;
	evalByCredential?: { [credIdB64u: string]: AuthenticationExtensionsPRFValues };
}

export interface AuthenticationExtensionsPRFValues {
	first: BufferSource;
	second?: BufferSource;
}

export interface AuthenticationExtensionsPRFOutputs {
	enabled: boolean;
	results: AuthenticationExtensionsPRFValues;
}


export interface AuthenticationExtensionsSignInputs {
	generateKey?: AuthenticationExtensionsSignGenerateKeyInputs;
	sign?: AuthenticationExtensionsSignSignInputs;
}

export interface AuthenticationExtensionsSignGenerateKeyInputs {
	algorithms: COSEAlgorithmIdentifier[];
	data?: BufferSource;
}

export interface AuthenticationExtensionsSignSignInputs {
	data: BufferSource;
	keyHandleByCredential: { [credentialId: string]: COSEKeyRef };
}

export type COSEKeyRef = BufferSource;

export type WebauthnSignKeyHandle = {
	credentialId: Uint8Array,
	keyHandle: Uint8Array,
}

interface AuthenticationExtensionsSignOutputs {
	generatedKey?: AuthenticationExtensionsSignGeneratedKey;
	signature?: ArrayBuffer;
};

interface AuthenticationExtensionsSignGeneratedKey {
	publicKey: ArrayBuffer;
	keyHandle: ArrayBuffer;
};



declare global {
	// Polyfill for https://www.w3.org/TR/webauthn-3/#prf-extension
	export interface AuthenticationExtensionsClientInputs {
		prf: AuthenticationExtensionsPRFInputs;
		sign?: AuthenticationExtensionsSignInputs;
	}

	export interface AuthenticationExtensionsClientOutputs {
		prf: AuthenticationExtensionsPRFOutputs;
		sign?: AuthenticationExtensionsSignOutputs;
	}
}


export function toArrayBuffer(buf: BufferSource): ArrayBuffer {
	if (buf instanceof ArrayBuffer) {
		return buf;
	} else {
		return buf.buffer;
	}
}
