import { v4 as uuidv4 } from 'uuid';


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


	const createChallenge = async (type: "get", userHandle?: string, prfSalt?: Uint8Array) => {
		try {
			const array = new Uint8Array(32);

			// Fill the array with cryptographically secure random values
			const challenge = window.crypto.getRandomValues(array);
			const returnData = {
				userHandle,
				prfSalt,
				id: uuidv4(),
				challenge: challenge,
			};
			return returnData;
		}
		catch(err) {
			return null;
		}
	}
	return {
		loginWebAuthnBeginOffline: async (): Promise<{ challengeId: string, getOptions: any }> => {
			const challenge = await createChallenge("get");
			const getOptions = makeGetOptions({ challenge: challenge.challenge });
			return {
				challengeId: challenge.id,
				getOptions: getOptions
			}
		},
	}

}
