import { HasherAlgorithm, HasherAndAlgorithm, SdJwt } from "@sd-jwt/core";
import { CredentialParsingError } from "../error";
import { Context, CredentialParser, HttpClient } from "../interfaces";
import { VerifiableCredentialFormat } from "../types";
import { CredentialRenderingService } from "../rendering";
import { fromBase64 } from "../utils/util";




export function SDJWTVCParser(args: { context: Context, httpClient: HttpClient }): CredentialParser {
	const encoder = new TextEncoder();

	// Encoding the string into a Uint8Array
	const hasherAndAlgorithm: HasherAndAlgorithm = {
		hasher: (input: string) => {
			return args.context.subtle.digest('SHA-256', encoder.encode(input)).then((v) => new Uint8Array(v));
		},
		algorithm: HasherAlgorithm.Sha256
	};

	const cr = CredentialRenderingService();

	async function getSdJwtVcMetadata(credential: string): Promise<{ credentialMetadata: any } | { error: "NOT_FOUND" }> {
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
			const fetchResult = await args.httpClient.get(credentialPayload.vct);
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

	return {
		async parse({ rawCredential }) {
			if (typeof rawCredential !== 'string') {
				return {
					success: false,
					error: CredentialParsingError.InvalidDatatype
				};
			}

			let dataUri: string | null = null;
			const parsedClaims: Record<string, unknown> | null = await SdJwt.fromCompact<Record<string, unknown>, any>(rawCredential)
				.withHasher(hasherAndAlgorithm)
				.getPrettyClaims()
				.then((signedClaims) => signedClaims)
				.catch(() => null);
			if (parsedClaims === null) {
				return {
					success: false,
					error: CredentialParsingError.CouldNotParse,
				};
			}

			if (typeof parsedClaims.iss !== 'string') {
				return {
					success: false,
					error: CredentialParsingError.MissingIssuerIdentifier,
				}
			}

			if ('exp' in parsedClaims &&
				typeof parsedClaims.exp === 'number' &&
				Math.floor(Date.now() / 1000) + args.context.clockTolerance > parsedClaims.exp) {

			}

			// const response = await args.httpClient.get<unknown>(`${parsedClaims.iss}/.well-known/openid-credential-issuer`).catch(() => null);

			let credentialFriendlyName: string | null = null;

			const getSdJwtMetadataResult = await getSdJwtVcMetadata(rawCredential);
			if (!('error' in getSdJwtMetadataResult)) {
				const { credentialMetadata } = getSdJwtMetadataResult;

				let displayMetadata = credentialMetadata.display.filter((d: any) => d.lang === args.context.lang)[0];

				let credentialImageSvgTemplateURL: string | null = displayMetadata?.rendering?.svg_templates?.[0]?.uri || null;
				const simple: string | null = displayMetadata?.rendering?.simple || null;

				if (credentialImageSvgTemplateURL) {
					const response = await args.httpClient.get(credentialImageSvgTemplateURL);
					if (response.status === 200) {
						const svgdata = response.data as string;
						if (svgdata) {
							const svgContent = await cr.renderSvgTemplate({ json: parsedClaims, credentialImageSvgTemplate: svgdata, sdJwtVcMetadataClaims: credentialMetadata.claims });
							dataUri = svgContent ? svgContent : "";
						}
					}
				}
			}

			return {
				success: true,
				value: {
					signedClaims: parsedClaims,
					metadata: {
						credential: {
							format: VerifiableCredentialFormat.VC_SDJWT,
							image: {
								dataUri: dataUri ?? "",
							},
							name: credentialFriendlyName ?? "Credential",
						},
						issuer: {
							id: parsedClaims.iss,
							name: parsedClaims.iss,
						}
					}
				}
			}
		},
	}
}
