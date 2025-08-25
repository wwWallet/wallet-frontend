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
	previewSign?: AuthenticationExtensionsSignSignInputs;
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
	keyHandle: ArrayBuffer;
	publicKey: ArrayBuffer;
	algorithm: COSEAlgorithmIdentifier;
	attestationObject: ArrayBuffer;
};



declare global {
	// Polyfill for https://www.w3.org/TR/webauthn-3/#prf-extension
	export interface AuthenticationExtensionsClientInputs {
		prf?: AuthenticationExtensionsPRFInputs;
		previewSign?: AuthenticationExtensionsSignInputs;
	}

	export interface AuthenticationExtensionsClientOutputs {
		prf?: AuthenticationExtensionsPRFOutputs;
		previewSign?: AuthenticationExtensionsSignOutputs;
	}
}


export function toArrayBuffer(buf: BufferSource): ArrayBuffer {
	if (buf instanceof ArrayBuffer) {
		return buf;
	} else {
		return buf.buffer;
	}
}
