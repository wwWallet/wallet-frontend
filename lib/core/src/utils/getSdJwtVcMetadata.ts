import { HttpClient } from '../interfaces';
import { fromBase64 } from './util';

export async function getSdJwtVcMetadata(httpClient: HttpClient, credential: string): Promise<{ credentialMetadata: any } | { error: "NOT_FOUND" }> {
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
		const vctUrl = new URL(credentialPayload.vct); // check that vct is a valid URL
		if (!vctUrl.protocol.startsWith('http') || !vctUrl.protocol.startsWith('https')) {
			throw new Error("vct uri does not follow http or http protocol");
		}
		const fetchResult = await httpClient.get(vctUrl.toString());
		if (fetchResult && fetchResult.status === 200 && (fetchResult.data as Record<string, unknown>).vct === credentialPayload.vct) {
			return { credentialMetadata: fetchResult.data };
		}

		return { error: "NOT_FOUND" };
	}
	catch (err) {
		console.log(err);
		return { error: "NOT_FOUND" };
	}
}
