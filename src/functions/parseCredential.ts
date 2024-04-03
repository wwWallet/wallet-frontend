import parseJwt from './ParseJwt';
import {
	HasherAlgorithm,
	HasherAndAlgorithm,
	SdJwt,
} from '@sd-jwt/core'

export enum CredentialFormat {
	VC_SD_JWT = "vc+sd-jwt",
	JWT_VC_JSON = "jwt_vc_json"
}

const encoder = new TextEncoder();

// Encoding the string into a Uint8Array
const hasherAndAlgorithm: HasherAndAlgorithm = {
	hasher: (input: string) => {
		return crypto.subtle.digest('SHA-256', encoder.encode(input)).then((v) => new Uint8Array(v));
	},
	algorithm: HasherAlgorithm.Sha256
}

export const parseCredential = async (credential: string | object): Promise<object> => {
	if (typeof credential == 'string') { // is JWT
		if (credential.includes('~')) { // is SD-JWT
			return SdJwt.fromCompact<Record<string, unknown>, any>(credential)
				.withHasher(hasherAndAlgorithm)
				.getPrettyClaims()
				.then((payload) => payload.vc);
		}
		else { // is plain JWT
			return parseJwt(credential)
				.then((payload) => payload.vc);
		}
	}
	throw new Error("Type of credential is not supported")
}
