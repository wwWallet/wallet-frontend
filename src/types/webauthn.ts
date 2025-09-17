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
	tbs?: BufferSource;
}

export interface AuthenticationExtensionsSignSignInputs {
	tbs: BufferSource;
	keyHandleByCredential: { [credentialId: string]: COSEKeyRef };
}

export type COSEKeyRef = BufferSource;

interface AuthenticationExtensionsSignOutputs {
	generatedKey?: AuthenticationExtensionsSignGeneratedKey;
	signature?: ArrayBuffer;
};

interface AuthenticationExtensionsSignGeneratedKey {
	publicKey: ArrayBuffer;
	keyHandle: ArrayBuffer;
};



declare global {
	// The below polyfill seems not needed for
	// https://www.w3.org/TR/2025/WD-webauthn-3-20250127/#dom-publickeycredentialcreationoptions-hints
	// for some reason, I have no idea why

	// Polyfill for https://www.w3.org/TR/2025/WD-webauthn-3-20250127/#dom-publickeycredentialrequestoptions-hints
	interface PublicKeyCredentialRequestOptions {
		allowCredentials?: PublicKeyCredentialDescriptor[];
		challenge: BufferSource;
		extensions?: AuthenticationExtensionsClientInputs;
		hints?: string[];
		rpId?: string;
		timeout?: number;
		userVerification?: UserVerificationRequirement;
	}

	// Polyfill for https://www.w3.org/TR/webauthn-3/#prf-extension
	export interface AuthenticationExtensionsClientInputs {
		prf?: AuthenticationExtensionsPRFInputs;
		sign?: AuthenticationExtensionsSignInputs;
	}

	export interface AuthenticationExtensionsClientOutputs {
		prf?: AuthenticationExtensionsPRFOutputs;
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
