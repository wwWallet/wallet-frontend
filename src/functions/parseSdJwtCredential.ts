import { getClaims } from './SdJwtUtils';

export enum CredentialFormat {
	VC_SD_JWT = "vc+sd-jwt",
	JWT_VC_JSON = "jwt_vc_json"
}

export const parseSdJwtCredential = async (credential: string | object): Promise<{ beautifiedForm: any; } | { error: string }> => {
	try {
		if (typeof credential == 'string') { // is JWT
			if (credential.includes('~')) { // is SD-JWT
				const parsed = await getClaims(credential);
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
