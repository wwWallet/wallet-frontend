import { getItem } from '../indexedDB';
import * as SimpleWebauthn from '@simplewebauthn/server';
import { base64url } from 'jose';
import { v4 as uuidv4 } from 'uuid';
import { toBase64Url } from '../util';
import { CachedUser } from '../services/LocalStorageKeystore';

class UserEntity {
	id: number;

	username: string = "NULL";

	displayName: string = "NULL";

	did: string;

	passwordHash: string = "NULL";

	keys: Uint8Array;

	isAdmin: boolean = false;

	privateData: Uint8Array;

	webauthnUserHandle: string;

	// walletType: WalletType = WalletType.DB;

	webauthnCredentials: WebauthnCredentialEntity[];

	// fcmTokenList: FcmTokenEntity[];
}

class WebauthnCredentialEntity {
	id: string;

	user: UserEntity;

	credentialId: Uint8Array;

	userHandle: Uint8Array;

	nickname: string = "NULL";

	createTime: Date;

	lastUseTime: Date;

	publicKeyCose: Uint8Array;

	signatureCount: number = 0;

	transports: string[];

	attestationObject: Uint8Array;

	create_clientDataJSON: Uint8Array;

	prfCapable: boolean;

	getCredentialDescriptor() {
		return {
			type: "public-key",
			id: this.credentialId,
			transports: this.transports || [],
		};
	}
}



export const LocalAuthentication = () => {
	const rpId = "localhost";

	const makeGetOptions = ({
		challenge,
		user,
	}: {
		challenge: Uint8Array,
		user?: {
			webauthnCredentials: WebauthnCredentialEntity[],
		},
	}) => {
		return {
			publicKey: {
				rpId: rpId,
				challenge: challenge,
				allowCredentials: (user?.webauthnCredentials || []).map(cred => cred.getCredentialDescriptor()),
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
			// store the challenge
			// ...
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


		loginWebAuthnFinishOffline: async (beginData: any, response: AuthenticatorAssertionResponse, credential: PublicKeyCredential, transformedCredential: any, cachedUser?: CachedUser) => {
			const getUserByWebauthnCredential = async (userHandle: string, credentialId: Uint8Array): Promise<{ user: any, credentialRecord: any }> => {
				const userId = await getItem("UserHandleToUserID", userHandle);
				const u = await getItem("users", String(userId));
				return { user: u, credentialRecord: u.webauthnCredentials.filter((cred: any) => cred.credentialId.data.toString() == credentialId.toString())[0] };
			}
			const { user, credentialRecord } = await getUserByWebauthnCredential(response.userHandle ? toBase64Url(response.userHandle) : cachedUser?.userHandleB64u, base64url.decode(credential.id))
			const verification = await SimpleWebauthn.verifyAuthenticationResponse({
				response: transformedCredential as any,
				expectedChallenge: base64url.encode(beginData.getOptions.publicKey.challenge),
				expectedOrigin: process.env.REACT_APP_WEBAUTHN_ORIGIN,
				expectedRPID: process.env.REACT_APP_WEBAUTHN_RPID,
				requireUserVerification: true,
				authenticator: {
					credentialID: credentialRecord.credentialId,
					credentialPublicKey: credentialRecord.publicKeyCose.data, // the raw data instead of { type: "Uint8Array", data: [...] }
					counter: credentialRecord.signatureCount,
				},
			});

			if (!verification.verified) {
				throw new Error('Could not verify the webauthn credential');
			}
			return {
				newUser: user,
				session: {
					id: user.id,
					appToken: "",
					did: user.did,
					displayName: user.displayName,
					privateData: user.privateData,
					username: null
				}
			}
		}
	}

}
