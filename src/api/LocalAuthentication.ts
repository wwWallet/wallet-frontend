import * as config from '../config';


export function loginWebAuthnBeginOffline(): { getOptions: { publicKey: PublicKeyCredentialRequestOptions } } {
	return {
		getOptions: {
			publicKey: {
				rpId: config.WEBAUTHN_RPID,
				// Throwaway challenge, we won't actually verify this for offline login
				challenge: window.crypto.getRandomValues(new Uint8Array(32)),
				allowCredentials: [],
				userVerification: "required",
			},
		},
	};
}
