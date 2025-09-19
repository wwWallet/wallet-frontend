export {}; // Make sure the file is a module instead of a script, othwerwise `declare global` is not allowed

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
}
