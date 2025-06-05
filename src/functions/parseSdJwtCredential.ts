import {
	HasherAlgorithm,
	HasherAndAlgorithm,
	SdJwt,
} from '@sd-jwt/core'


const encoder = new TextEncoder();

// Encoding the string into a Uint8Array
const hasherAndAlgorithm: HasherAndAlgorithm = {
	hasher: (input: string) => {
		return crypto.subtle.digest('SHA-256', encoder.encode(input)).then((v) => new Uint8Array(v));
	},
	algorithm: HasherAlgorithm.Sha256
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
		}
		return { error: "Could not parse SDJWT credential" };
	}
	catch (err) {
		console.error(err);
		return { error: "Could not parse SDJWT credential" };
	}

}
