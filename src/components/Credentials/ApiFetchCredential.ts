// apiUtils.js

import { BackendApi } from '../../api';
import parseJwt from '../../functions/ParseJwt';
import {
	HasherAlgorithm,
	HasherAndAlgorithm,
	SdJwt,
} from '@sd-jwt/core'

enum CredentialFormat {
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

const parseCredentialDependingOnFormat = async (credential: string, format: string): Promise<any> => {
	switch (format) {
	case CredentialFormat.JWT_VC_JSON:
		return parseJwt(credential);
	case CredentialFormat.VC_SD_JWT:
		return SdJwt.fromCompact<Record<string, unknown>, any>(credential)
			.withHasher(hasherAndAlgorithm)
			.getPrettyClaims();
	default:
		throw new Error("Format is not recognised");
	}
}

export async function fetchCredentialData(api: BackendApi, id = null) {
	try {
		const response = await api.get('/storage/vc');

    if (id) {
      const targetImage = response.data.vc_list.find((img) => img.id.toString() === id);
      const newImages = targetImage
        ? await Promise.all([targetImage].map(async (item) => {
					const credentialPayload = await parseCredentialDependingOnFormat(item.credential, item.format);
					return ({
            id: item.id,
						credentialIdentifier:item.credentialIdentifier,
            src: item.logoURL,
            alt: item.issuerFriendlyName,
            data: credentialPayload["vc"]['credentialSubject'],
            type: credentialPayload['vc']["type"]["2"],
            expdate: credentialPayload['vc']["expirationDate"],
						json: JSON.stringify(credentialPayload["vc"], null, 2)
          });
				}))
        : [];

      return newImages[0];
    } else {
      const newImages = await Promise.all(response.data.vc_list.map(async (item) => {
				const credentialPayload = await parseCredentialDependingOnFormat(item.credential, item.format);
				return ({
					id: item.id,
					credentialIdentifier:item.credentialIdentifier,
					src: item.logoURL,
					alt: item.issuerFriendlyName,
					data: credentialPayload["vc"]['credentialSubject'],
					type: credentialPayload['vc']["type"]["2"],
					expdate: credentialPayload['vc']["expirationDate"],
					json:JSON.stringify(credentialPayload["vc"], null, 2)
				})
			}));

			return newImages;
		}
	} catch (error) {
		console.error('Failed to fetch data', error);
		return null;
	}
}
