import { CredentialParsingError } from "../error";
import { Context, CredentialParser, HttpClient } from "../interfaces";
import { DataItem, DeviceSignedDocument, parse } from "@auth0/mdl";
import { fromBase64Url } from "../utils/util";
import { ParsedCredential, VerifiableCredentialFormat } from "../types";
import { cborDecode, cborEncode } from "@auth0/mdl/lib/cbor";
import { IssuerSigned } from "@auth0/mdl/lib/mdoc/model/types";
import { OpenID4VCICredentialRendering } from "../functions/openID4VCICredentialRendering";

export function MsoMdocParser(args: { context: Context, httpClient: HttpClient }): CredentialParser {


	function extractValidityInfo(issuerSigned: IssuerSigned): { validUntil?: Date, validFrom?: Date, signed?: Date } {
		return issuerSigned.issuerAuth.decodedPayload.validityInfo;
	}

	async function deviceResponseParser(rawCredential: string): Promise<ParsedCredential | null> {
		try {
			const decodedCred = fromBase64Url(rawCredential)
			const parsedMDOC = parse(decodedCred);
			const [parsedDocument] = parsedMDOC.documents as DeviceSignedDocument[];
			const namespace = parsedDocument.issuerSignedNameSpaces[0];

			const attrValues = parsedDocument.getIssuerNameSpace(namespace);
			const renderer = OpenID4VCICredentialRendering({ httpClient: args.httpClient });
			let dataUri: string | null = null;

			const mdocDisplayConfig = {
				name: "mdoc Verifiable Credential"
			}

			const svgContent = await renderer.renderCustomSvgTemplate({ signedClaims: attrValues, displayConfig: mdocDisplayConfig })
				.then((res) => res)
				.catch((err) => { console.error(err); return null; });

			dataUri = svgContent ? svgContent : "";
			return {
				metadata: {
					credential: {
						format: VerifiableCredentialFormat.MSO_MDOC,
						doctype: parsedDocument.docType,
						image: {
							dataUri: dataUri ?? "",
						},
						name: parsedDocument.issuerSignedNameSpaces[0]
					},
					issuer: {
						id: parsedDocument.issuerSigned.issuerAuth.certificate.issuer,
						name: parsedDocument.issuerSigned.issuerAuth.certificate.issuer
					}
				},
				signedClaims: {
					...attrValues
				},
				validityInfo: {
					...extractValidityInfo(parsedDocument.issuerSigned),
				}
			}
		}
		catch (err) {
			return null;
		}
	}

	async function issuerSignedParser(rawCredential: string): Promise<ParsedCredential | null> {
		try {
			const credentialBytes = fromBase64Url(rawCredential);
			const issuerSigned: Map<string, unknown> = cborDecode(credentialBytes);
			const [header, _, payload, sig] = issuerSigned.get('issuerAuth') as Array<Uint8Array>;
			const decodedIssuerAuthPayload: DataItem = cborDecode(payload);
			const docType = decodedIssuerAuthPayload.data.get('docType');
			const m = {
				version: '1.0',
				documents: [new Map([
					['docType', docType],
					['issuerSigned', issuerSigned]
				])],
				status: 0
			};
			const encoded = cborEncode(m);
			const mdoc = parse(encoded);
			const [parsedDocument] = mdoc.documents;

			const namespace = parsedDocument.issuerSignedNameSpaces[0];
			const attrValues = parsedDocument.getIssuerNameSpace(namespace);

			const renderer = OpenID4VCICredentialRendering({ httpClient: args.httpClient });
			let dataUri: string | null = null;

			const mdocDisplayConfig = {
				name: "mdoc Verifiable Credential"
			}

			const svgContent = await renderer.renderCustomSvgTemplate({ signedClaims: attrValues, displayConfig: mdocDisplayConfig })
				.then((res) => res)
				.catch((err) => { console.error(err); return null; })
			dataUri = svgContent ? svgContent : "";
			return {
				metadata: {
					credential: {
						format: VerifiableCredentialFormat.MSO_MDOC,
						doctype: docType as string | undefined ?? "",
						image: {
							dataUri: dataUri ?? "",
						},
						name: parsedDocument.issuerSignedNameSpaces[0],
					},
					issuer: {
						id: parsedDocument.issuerSigned.issuerAuth.certificate.issuer,
						name: parsedDocument.issuerSigned.issuerAuth.certificate.issuer
					}
				},
				signedClaims: {
					...attrValues
				},
				validityInfo: {
					...extractValidityInfo(parsedDocument.issuerSigned),
				}
			}

		}
		catch (err) {
			return null;
		}
	}

	return {
		async parse({ rawCredential }) {
			if (typeof rawCredential != 'string') {
				return {
					success: false,
					error: CredentialParsingError.InvalidDatatype,
				}
			}

			const deviceResponseParsingResult = await deviceResponseParser(rawCredential);
			if (deviceResponseParsingResult) {
				return {
					success: true,
					value: deviceResponseParsingResult
				}
			}

			const issuerSignedParsingResult = await issuerSignedParser(rawCredential);
			if (issuerSignedParsingResult) {
				return {
					success: true,
					value: issuerSignedParsingResult,
				}
			}

			return {
				success: false,
				error: CredentialParsingError.CouldNotParse,
			}
		},
	}
}
