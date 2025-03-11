import { HasherAlgorithm, HasherAndAlgorithm, SdJwt } from "@sd-jwt/core";
import { CredentialParsingError } from "../error";
import { Context, CredentialParser, HttpClient } from "../interfaces";
import { VerifiableCredentialFormat } from "../types";
import { CredentialRenderingService } from "../rendering";
import { getSdJwtVcMetadata } from "../utils/getSdJwtVcMetadata";




export function SDJWTVCParser(args: { context: Context, httpClient: HttpClient }): CredentialParser {
	const encoder = new TextEncoder();

	function extractValidityInfo(jwtPayload: { exp?: number, iat?: number, nbf?: number }): { validUntil?: Date, validFrom?: Date, signed?: Date } {
		let obj = {};
		if (jwtPayload.exp) {
			obj = {
				...obj,
				validUntil: new Date(jwtPayload.exp * 1000),
			}
		}
		if (jwtPayload.iat) {
			obj = {
				...obj,
				signed: new Date(jwtPayload.iat * 1000),
			}
		}

		if (jwtPayload.nbf) {
			obj = {
				...obj,
				validFrom: new Date(jwtPayload.nbf * 1000),
			}
		}
		return obj;
	}

	// Encoding the string into a Uint8Array
	const hasherAndAlgorithm: HasherAndAlgorithm = {
		hasher: (input: string) => {
			return args.context.subtle.digest('SHA-256', encoder.encode(input)).then((v) => new Uint8Array(v));
		},
		algorithm: HasherAlgorithm.Sha256
	};

	const cr = CredentialRenderingService();


	return {
		async parse({ rawCredential }) {
			if (typeof rawCredential !== 'string') {
				return {
					success: false,
					error: CredentialParsingError.InvalidDatatype
				};
			}

			let dataUri: string | null = null;
			const parsedClaims: Record<string, unknown> | null = await (async () => {
				try {
					return await SdJwt.fromCompact<Record<string, unknown>, any>(rawCredential)
						.withHasher(hasherAndAlgorithm)
						.getPrettyClaims()
						.then((signedClaims) => signedClaims)
						.catch(() => null);
				}
				catch (err) {
					return null;
				}

			})();
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

			// const response = await args.httpClient.get<unknown>(`${parsedClaims.iss}/.well-known/openid-credential-issuer`).catch(() => null);

			let credentialFriendlyName: string | null = null;

			const getSdJwtMetadataResult = await getSdJwtVcMetadata(args.httpClient,rawCredential);
			if (!('error' in getSdJwtMetadataResult)) {
				const { credentialMetadata } = getSdJwtMetadataResult;

				let displayMetadata = credentialMetadata.display.filter((d: any) => d.lang === args.context.lang)[0];

				let credentialImageSvgTemplateURL: string | null = displayMetadata?.rendering?.svg_templates?.[0]?.uri || null;
				const simple: string | null = displayMetadata?.rendering?.simple || null;

				if (credentialImageSvgTemplateURL) {
					const response = await args.httpClient.get(credentialImageSvgTemplateURL).then((res) => res).catch(() => null);
					if (response && response.status === 200) {
						const svgdata = response.data as string;
						if (svgdata) {
							const svgContent = await cr.renderSvgTemplate({ json: parsedClaims, credentialImageSvgTemplate: svgdata, sdJwtVcMetadataClaims: credentialMetadata.claims })
								.then((res) => res)
								.catch(() => null);
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
							// @ts-ignore
							metadataDocuments: [getSdJwtMetadataResult.credentialMetadata],
							image: {
								dataUri: dataUri ?? "",
							},
							name: credentialFriendlyName ?? "Credential",
						},
						issuer: {
							id: parsedClaims.iss,
							name: parsedClaims.iss,
						}
					},
					validityInfo: {
						...extractValidityInfo(parsedClaims)
					}
				}
			}
		},
	}
}
