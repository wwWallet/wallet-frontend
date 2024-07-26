export const LocalAuthentication = () => {
	const rpId = process.env.REACT_APP_WEBAUTHN_RPID;

	const makeGetOptions = ({
		challenge,
	}: {
		challenge: Uint8Array,
	}) => {
		return {
			publicKey: {
				rpId: rpId,
				challenge: challenge,
				allowCredentials: [],
				userVerification: "required",
			},
		};
	}

	return {
		loginWebAuthnBeginOffline: async (): Promise<{ getOptions: any }> => {
			const getOptions = makeGetOptions({
				// Throwaway challenge, we won't actually verify this for offline login
				challenge: window.crypto.getRandomValues(new Uint8Array(32)),
			});
			return {
				getOptions: getOptions
			}
		},
	}

}
