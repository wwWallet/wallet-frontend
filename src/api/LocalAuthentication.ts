const rpId = process.env.REACT_APP_WEBAUTHN_RPID ?? "localhost";

export function loginWebAuthnBeginOffline(): { getOptions: { publicKey: PublicKeyCredentialRequestOptions } } {
	return {
		getOptions: {
			publicKey: {
				rpId: rpId,
				// Throwaway challenge, we won't actually verify this for offline login
				challenge: window.crypto.getRandomValues(new Uint8Array(32)),
				allowCredentials: [],
				userVerification: "required",
			},
		},
	};
}
