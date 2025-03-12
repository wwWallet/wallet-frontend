import { JWK } from "jose";
import { CredentialVerificationError } from "../error";
import { Context, CredentialVerifier, PublicKeyResolverEngineI } from "../interfaces";
import { fromBase64Url } from "../utils/util";
import { DataItem, DeviceSignedDocument, IssuerSignedDocument, MDoc, parse, Verifier } from "@auth0/mdl";
import { IssuerSigned } from "@auth0/mdl/lib/mdoc/model/types";
import { cborDecode, cborEncode } from "@auth0/mdl/lib/cbor/";
import { COSEKeyToJWK } from "cose-kit";


export function MsoMdocVerifier(args: { context: Context, pkResolverEngine: PublicKeyResolverEngineI }): CredentialVerifier {
	let errors: { error: CredentialVerificationError, message: string }[] = [];
	const logError = (error: CredentialVerificationError, message: string): void => {
		errors.push({ error, message });
	}

	const verifier = new Verifier(args.context.trustedCertificates.map((crt) =>
		`-----BEGIN CERTIFICATE-----\n${crt}\n-----END CERTIFICATE-----`
	));


	const getSessionTranscriptBytesForOID4VPHandover = async (clId: string, respUri: string, nonce: string, mdocNonce: string) => cborEncode(
		DataItem.fromData(
			[
				null,
				null,
				[
					await args.context.subtle.digest(
						'SHA-256',
						cborEncode([clId, mdocNonce]),
					),
					await args.context.subtle.digest(
						'SHA-256',
						cborEncode([respUri, mdocNonce]),
					),
					nonce
				]
			]
		)
	);

	async function expirationCheck(issuerSigned: IssuerSigned): Promise<null | CredentialVerificationError.ExpiredCredential> {
		const { validFrom, validUntil, signed } = issuerSigned.issuerAuth.decodedPayload.validityInfo;
		if (Math.floor(validUntil.getTime() / 1000) + args.context.clockTolerance < Math.floor(new Date().getTime() / 1000)) {
			logError(CredentialVerificationError.ExpiredCredential, "Credential is expired");
			return CredentialVerificationError.ExpiredCredential;
		}
		return null;
	}

	function extractHolderPublicKeyJwk(parsedDocument: IssuerSignedDocument): JWK | null {
		if (parsedDocument.issuerSigned.issuerAuth.decodedPayload.deviceKeyInfo == undefined) {
			logError(CredentialVerificationError.MsoMdocMissingDeviceKeyInfo, "MsoMdocMissingDeviceKeyInfo");
			return null;
		}

		const cosePublicKey = parsedDocument.issuerSigned.issuerAuth.decodedPayload.deviceKeyInfo.deviceKey;
		const holderPublicKeyJwk = COSEKeyToJWK(cosePublicKey);
		return holderPublicKeyJwk as JWK;
	}

	async function issuerSignedCheck(rawCredential: string): Promise<{ holderPublicKeyJwk: JWK | null }> {
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
			const expirationCheckRes = await expirationCheck(parsedDocument.issuerSigned);
			if (expirationCheckRes !== null) {
				return { holderPublicKeyJwk: null };
			}

			if (parsedDocument.issuerSigned.issuerAuth.x5chain && args.context.trustedCertificates.length > 0) {
				const { publicKey } = await parsedDocument.issuerSigned.issuerAuth.verifyX509Chain(args.context.trustedCertificates);
				if (!publicKey) {
					logError(CredentialVerificationError.NotTrustedIssuer, "Issuer is not trusted");
					return { holderPublicKeyJwk: null };
				}
				const verification = await parsedDocument.issuerSigned.issuerAuth.verify(publicKey);
				if (verification !== true) {
					logError(CredentialVerificationError.InvalidSignature, "Invalid signature");
				}
				const holderPublicKeyJwk = extractHolderPublicKeyJwk(parsedDocument);

				return {
					holderPublicKeyJwk
				};
			}
			const holderPublicKeyJwk = extractHolderPublicKeyJwk(parsedDocument);

			return {
				holderPublicKeyJwk
			};

		}
		catch (err) {
			// @ts-ignore
			if (err?.name && err.name === "X509InvalidCertificateChain") {
				logError(CredentialVerificationError.InvalidCertificateChain, "Invalid Certificate chain: " + JSON.stringify(err))
			}
		}
		return { holderPublicKeyJwk: null };

	}

	async function deviceResponseCheck(mdoc: MDoc, opts: {
		expectedNonce?: string;
		expectedAudience?: string;
		holderNonce?: string;
		responseUri?: string;
	}): Promise<{ holderPublicKeyJwk: JWK | null }> {
		try {
			const [parsedDocument] = mdoc.documents as DeviceSignedDocument[];
			if (!parsedDocument.deviceSigned) { // not a DeviceResponse
				return { holderPublicKeyJwk: null };
			}

			if (args.context.trustedCertificates.length > 0) {
				const res = await parsedDocument.issuerSigned.issuerAuth.verifyX509(args.context.trustedCertificates);
				if (!res) {
					logError(CredentialVerificationError.NotTrustedIssuer, "Issuer is not trusted");
					return { holderPublicKeyJwk: null };
				}
			}

			const expiredResult = await expirationCheck(parsedDocument.issuerSigned);
			if (expiredResult) {
				return { holderPublicKeyJwk: null };
			}

			const holderPublicKeyJwk = extractHolderPublicKeyJwk(parsedDocument);

			if (opts.expectedAudience && opts.responseUri && opts.expectedNonce && opts.holderNonce) {
				await verifier.verify(mdoc.encode(), {
					encodedSessionTranscript: await getSessionTranscriptBytesForOID4VPHandover(
						opts.expectedAudience,
						opts.responseUri,
						opts.expectedNonce,
						opts.holderNonce)
				});
				return { holderPublicKeyJwk };
			}

			return { holderPublicKeyJwk: holderPublicKeyJwk }

		}
		catch (err) {
			if (err instanceof Error) {
				if (err.name === "X509InvalidCertificateChain") {
					logError(CredentialVerificationError.NotTrustedIssuer, "Issuer is not trusted");
					return { holderPublicKeyJwk: null };
				}
				else if (err.name === "MDLError") {
					logError(CredentialVerificationError.InvalidSignature, `MDLError: ${err.message}`);
				}
				else {
					console.error(err);
				}
			}
			return { holderPublicKeyJwk: null };
		}
	}

	return {
		async verify({ rawCredential, opts }) {
			if (typeof rawCredential !== 'string') {
				return {
					success: false,
					error: CredentialVerificationError.InvalidDatatype,
				}
			}


			try {
				const decodedCred = fromBase64Url(rawCredential)
				const parsedMDOC = parse(decodedCred);
				const { holderPublicKeyJwk } = await deviceResponseCheck(parsedMDOC, opts);

				if (errors.length === 0 && holderPublicKeyJwk !== null) {
					return {
						success: true,
						value: {
							holderPublicKey: holderPublicKeyJwk,
						}
					}
				}

				if (errors.length > 0) {
					return {
						success: false,
						error: errors.length > 0 ?  errors[0].error : CredentialVerificationError.UnknownProblem,
					}
				}
			}
			catch (err) {
				const { holderPublicKeyJwk } = await issuerSignedCheck(rawCredential);
				if (errors.length === 0 && holderPublicKeyJwk !== null) {
					return {
						success: true,
						value: {
							holderPublicKey: holderPublicKeyJwk,
						}
					}
				}

				if (errors.length > 0) {
					return {
						success: false,
						error: errors.length > 0 ?  errors[0].error : CredentialVerificationError.UnknownProblem,
					}
				}
			}

			console.error(errors);


			return {
				success: false,
				error: CredentialVerificationError.UnknownProblem
			}
		},
	}
}
