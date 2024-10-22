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

const parseJwt = (token: string) => {
	var base64Url = token.split('.')[1];
	var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
	var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
			return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
	}).join(''));

	return JSON.parse(jsonPayload);
}

export const parseSdJwtCredential = async (credential: string | object): Promise<{ beautifiedForm: any; } | { error: string }> => {
	try {
		if (typeof credential == 'string') { // is JWT
			if (credential.includes('~')) { // is SD-JWT
				const parsed = await SdJwt.fromCompact<Record<string, unknown>, any>(credential)
					.withHasher(hasherAndAlgorithm)
					.getPrettyClaims()
					.then((payload) => payload);
				return {
					beautifiedForm: parsed
				}

			}

			return {
				beautifiedForm: parseJwt(credential),
			}
		}
		return { error: "Could not parse SDJWT credential" };
	}
	catch (err) {
		console.error(err);
		return { error: "Could not parse SDJWT credential" };
	}

}
