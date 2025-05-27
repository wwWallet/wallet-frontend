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

declare global {
	// Polyfill for https://www.w3.org/TR/webauthn-3/#prf-extension
	export interface AuthenticationExtensionsClientInputs {
		prf: AuthenticationExtensionsPRFInputs;
	}

	export interface AuthenticationExtensionsClientOutputs {
		prf: AuthenticationExtensionsPRFOutputs;
	}

}

export function toArrayBuffer(buf: BufferSource): ArrayBuffer {
	if (buf instanceof ArrayBuffer) {
		return buf;
	} else {
		return buf.buffer;
	}
}
