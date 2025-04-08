import { HasherAlgorithm, HasherAndAlgorithm, SdJwt } from "@sd-jwt/core";
import { CredentialParsingError } from "../error";
import { Context, CredentialParser, HttpClient } from "../interfaces";
import { VerifiableCredentialFormat } from "../types";
import { CredentialRenderingService } from "../rendering";
import { getSdJwtVcMetadata } from "../utils/getSdJwtVcMetadata";
import { OpenID4VCICredentialRendering } from "../functions/openID4VCICredentialRendering";
import { fromBase64Url } from "../utils/util";

export function SDJWTVCParser(args: { context: Context, httpClient: HttpClient }): CredentialParser {
	const encoder = new TextEncoder();
	const decoder = new TextDecoder();

	const hasherAndAlgorithm = (jwt: string): HasherAndAlgorithm => {
		// alg extraction
		const encodedHeader = fromBase64Url(jwt.split('.')[0]);
		const { alg } = JSON.parse(decoder.decode(encodedHeader)) as { alg: string };
		let hasherAlg = null;
		switch (alg) {
			case "ES256":
				hasherAlg = HasherAlgorithm.Sha256;
				break;
			case "ES512":
				hasherAlg = HasherAlgorithm.Sha512;
				break;
			default:
				throw new Error("not supported algorithm");
		}
		const hasherAndAlgorithm: HasherAndAlgorithm = {
			hasher: (input: string) => {
				return args.context.subtle.digest(hasherAlg.toUpperCase(), encoder.encode(input)).then((v) => new Uint8Array(v));
			},
			algorithm: hasherAlg
		};
		return hasherAndAlgorithm;
	}

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



	const cr = CredentialRenderingService();
	const renderer = OpenID4VCICredentialRendering({ httpClient: args.httpClient });


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
						.withHasher(hasherAndAlgorithm(rawCredential))
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

			// Fetch issuer metadata
			const issuerResponse = await args.httpClient
				.get(`${parsedClaims.iss}/.well-known/openid-credential-issuer`)
				.catch(() => null);

			const issuerMetadata = issuerResponse?.data as {
				credential_configurations_supported?: Record<string, any>;
			} | null;

			let credentialFriendlyName: string | null = null;

			const getSdJwtMetadataResult = await getSdJwtVcMetadata(args.httpClient, rawCredential);
			if (!('error' in getSdJwtMetadataResult)) {
				const { credentialMetadata } = getSdJwtMetadataResult;

				// Get localized display metadata from issuer metadata
				const issuerDisplay = issuerMetadata?.credential_configurations_supported?.[credentialMetadata.vct]?.display;
				const issuerDisplayLocalized = Array.isArray(issuerMetadata?.credential_configurations_supported?.[credentialMetadata.vct]?.display)
					? issuerDisplay.find((d: any) => d.locale === args.context.lang)
					: null;

				// Get localized display metadata from credential
				const credentialDisplayLocalized = Array.isArray(credentialMetadata?.display)
					? credentialMetadata.display.find((d: any) => d.lang === args.context.lang)
					: null;

				credentialFriendlyName = credentialDisplayLocalized?.name ?? null;

				let credentialImageSvgTemplateURL: string | null = credentialDisplayLocalized?.rendering?.svg_templates?.[0]?.uri || null;
				const simpleDisplayConfig = credentialDisplayLocalized?.rendering?.simple || null;

				// 1. Try to fetch SVG template and render
				if (credentialImageSvgTemplateURL) {
					const svgResponse = await args.httpClient.get(credentialImageSvgTemplateURL).then((res) => res).catch(() => null);
					if (svgResponse && svgResponse.status === 200) {
						const svgdata = svgResponse.data as string;
						dataUri = await cr
							.renderSvgTemplate({
								json: parsedClaims,
								credentialImageSvgTemplate: svgdata,
								sdJwtVcMetadataClaims: credentialMetadata.claims,
							})
							.catch(() => null);
					}
				}

				// 2. Fallback: render from simple config
				if (!dataUri && simpleDisplayConfig) {
					dataUri = await renderer
						.renderCustomSvgTemplate({
							signedClaims: parsedClaims,
							displayConfig: { ...credentialDisplayLocalized, ...simpleDisplayConfig },
						})
						.catch(() => null);
				}

				// 3. Fallback: render from issuer metadata display
				if (!dataUri && issuerDisplayLocalized) {
					dataUri = await renderer
						.renderCustomSvgTemplate({
							signedClaims: parsedClaims,
							displayConfig: issuerDisplayLocalized,
						})
						.catch(() => null);
				}
			}

			return {
				success: true,
				value: {
					signedClaims: parsedClaims,
					metadata: {
						credential: {
							format: VerifiableCredentialFormat.VC_SDJWT,
							vct: parsedClaims?.vct as string | undefined ?? "",
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
