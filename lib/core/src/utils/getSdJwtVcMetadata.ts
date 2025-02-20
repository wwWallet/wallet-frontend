import axios from 'axios';
import { fromBase64 } from './util';

/** uses https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/05/ to fetch the metadata */
export async function getSdJwtVcMetadata(credential: string): Promise<{ credentialMetadata: any } | { error: "NOT_FOUND" }> {
	try {
		const credentialHeader = JSON.parse(new TextDecoder().decode(fromBase64(credential.split('.')[0] as string)));
		const credentialPayload = JSON.parse(new TextDecoder().decode(fromBase64(credential.split('.')[1] as string)));

		if (credentialHeader.vctm) {
			const sdjwtvcMetadataDocument = credentialHeader.vctm.map((encodedMetadataDocument: string) =>
				JSON.parse(new TextDecoder().decode(fromBase64(encodedMetadataDocument)))
			).filter(((metadataDocument: Record<string, unknown>) => metadataDocument.vct === credentialPayload.vct))[0];
			if (sdjwtvcMetadataDocument) {
				return { credentialMetadata: sdjwtvcMetadataDocument };
			}
		}

		// use vct to fetch metadata if hosted
		const fetchResult = (await axios.get(credentialPayload.vct).catch(() => null));
		if (fetchResult && fetchResult.data.vct === credentialPayload.vct) {
			return { credentialMetadata: fetchResult.data };
		}

		return { error: "NOT_FOUND" };
	}
	catch (err) {
		console.log(err);
		return { error: "NOT_FOUND" };
	}
}
