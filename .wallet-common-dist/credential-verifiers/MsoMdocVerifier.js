"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MsoMdocVerifier = MsoMdocVerifier;
const error_1 = require("../error");
const util_1 = require("../utils/util");
const mdl_1 = require("@auth0/mdl");
const cbor_1 = require("@auth0/mdl/lib/cbor/");
const cose_kit_1 = require("cose-kit");
function MsoMdocVerifier(args) {
    let errors = [];
    const logError = (error, message) => {
        errors.push({ error, message });
    };
    // Note: The verifier is only used when delegateTrustToBackend is false (legacy mode)
    // Trust evaluation is now delegated to AuthZEN at the protocol level
    const verifier = new mdl_1.Verifier((args.context.trustedCertificates ?? []).map((crt) => `-----BEGIN CERTIFICATE-----\n${crt}\n-----END CERTIFICATE-----`));
    const getSessionTranscriptBytesForOID4VPHandover = async (clId, respUri, nonce, mdocNonce) => (0, cbor_1.cborEncode)(mdl_1.DataItem.fromData([
        null,
        null,
        [
            await args.context.subtle.digest('SHA-256', new Uint8Array((0, cbor_1.cborEncode)([clId, mdocNonce]))),
            await args.context.subtle.digest('SHA-256', new Uint8Array((0, cbor_1.cborEncode)([respUri, mdocNonce]))),
            nonce
        ]
    ]));
    async function expirationCheck(issuerSigned) {
        const { validFrom, validUntil, signed } = issuerSigned.issuerAuth.decodedPayload.validityInfo;
        if (Math.floor(validUntil.getTime() / 1000) + args.context.clockTolerance < Math.floor(new Date().getTime() / 1000)) {
            logError(error_1.CredentialVerificationError.ExpiredCredential, "Credential is expired");
            return error_1.CredentialVerificationError.ExpiredCredential;
        }
        return null;
    }
    function extractHolderPublicKeyJwk(parsedDocument) {
        if (parsedDocument.issuerSigned.issuerAuth.decodedPayload.deviceKeyInfo == undefined) {
            logError(error_1.CredentialVerificationError.MsoMdocMissingDeviceKeyInfo, "MsoMdocMissingDeviceKeyInfo");
            return null;
        }
        const cosePublicKey = parsedDocument.issuerSigned.issuerAuth.decodedPayload.deviceKeyInfo.deviceKey;
        const holderPublicKeyJwk = (0, cose_kit_1.COSEKeyToJWK)(cosePublicKey);
        return holderPublicKeyJwk;
    }
    async function issuerSignedCheck(rawCredential) {
        try {
            const credentialBytes = (0, util_1.fromBase64Url)(rawCredential);
            const issuerSigned = (0, cbor_1.cborDecode)(credentialBytes);
            const [header, _, payload, sig] = issuerSigned.get('issuerAuth');
            const decodedIssuerAuthPayload = (0, cbor_1.cborDecode)(payload);
            const docType = decodedIssuerAuthPayload.data.get('docType');
            const m = {
                version: '1.0',
                documents: [new Map([
                        ['docType', docType],
                        ['issuerSigned', issuerSigned]
                    ])],
                status: 0
            };
            const encoded = (0, cbor_1.cborEncode)(m);
            const mdoc = (0, mdl_1.parse)(encoded);
            const [parsedDocument] = mdoc.documents;
            const expirationCheckRes = await expirationCheck(parsedDocument.issuerSigned);
            if (expirationCheckRes !== null) {
                return { holderPublicKeyJwk: null };
            }
            // Only validate certificate chain if not delegating to backend
            // Trust evaluation is now delegated to AuthZEN at the protocol level
            const delegateTrustToBackend = args.context.delegateTrustToBackend ?? true;
            const trustedCertificates = args.context.trustedCertificates ?? [];
            if (parsedDocument.issuerSigned.issuerAuth.x5chain && !delegateTrustToBackend && trustedCertificates.length > 0) {
                const { publicKey } = await parsedDocument.issuerSigned.issuerAuth.verifyX509Chain(trustedCertificates);
                if (!publicKey) {
                    logError(error_1.CredentialVerificationError.NotTrustedIssuer, "Issuer is not trusted");
                    return { holderPublicKeyJwk: null };
                }
                const verification = await parsedDocument.issuerSigned.issuerAuth.verify(publicKey);
                if (verification !== true) {
                    logError(error_1.CredentialVerificationError.InvalidSignature, "Invalid signature");
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
                logError(error_1.CredentialVerificationError.InvalidCertificateChain, "Invalid Certificate chain: " + JSON.stringify(err));
            }
        }
        return { holderPublicKeyJwk: null };
    }
    async function deviceResponseCheck(mdoc, opts) {
        try {
            const [parsedDocument] = mdoc.documents;
            if (!parsedDocument.deviceSigned) { // not a DeviceResponse
                return { holderPublicKeyJwk: null };
            }
            // Only validate certificate chain if not delegating to backend
            // Trust evaluation is now delegated to AuthZEN at the protocol level
            const delegateTrustToBackend = args.context.delegateTrustToBackend ?? true;
            const trustedCertificates = args.context.trustedCertificates ?? [];
            if (!delegateTrustToBackend && trustedCertificates.length > 0) {
                const res = await parsedDocument.issuerSigned.issuerAuth.verifyX509(trustedCertificates);
                if (!res) {
                    logError(error_1.CredentialVerificationError.NotTrustedIssuer, "Issuer is not trusted");
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
                    encodedSessionTranscript: await getSessionTranscriptBytesForOID4VPHandover(opts.expectedAudience, opts.responseUri, opts.expectedNonce, opts.holderNonce)
                });
                return { holderPublicKeyJwk };
            }
            return { holderPublicKeyJwk: holderPublicKeyJwk };
        }
        catch (err) {
            if (err instanceof Error) {
                if (err.name === "X509InvalidCertificateChain") {
                    logError(error_1.CredentialVerificationError.NotTrustedIssuer, "Issuer is not trusted");
                    return { holderPublicKeyJwk: null };
                }
                else if (err.name === "MDLError") {
                    logError(error_1.CredentialVerificationError.InvalidSignature, `MDLError: ${err.message}`);
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
                    error: error_1.CredentialVerificationError.InvalidDatatype,
                };
            }
            try {
                const decodedCred = (0, util_1.fromBase64Url)(rawCredential);
                const parsedMDOC = (0, mdl_1.parse)(decodedCred);
                const { holderPublicKeyJwk } = await deviceResponseCheck(parsedMDOC, opts);
                if (errors.length === 0 && holderPublicKeyJwk !== null) {
                    return {
                        success: true,
                        value: {
                            holderPublicKey: holderPublicKeyJwk,
                        }
                    };
                }
                if (errors.length > 0) {
                    return {
                        success: false,
                        error: errors.length > 0 ? errors[0].error : error_1.CredentialVerificationError.UnknownProblem,
                    };
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
                    };
                }
                if (errors.length > 0) {
                    return {
                        success: false,
                        error: errors.length > 0 ? errors[0].error : error_1.CredentialVerificationError.UnknownProblem,
                    };
                }
            }
            console.error(errors);
            return {
                success: false,
                error: error_1.CredentialVerificationError.UnknownProblem
            };
        },
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXNvTWRvY1ZlcmlmaWVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NyZWRlbnRpYWwtdmVyaWZpZXJzL01zb01kb2NWZXJpZmllci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQVVBLDBDQTRPQztBQXJQRCxvQ0FBdUQ7QUFFdkQsd0NBQThDO0FBQzlDLG9DQUF5RztBQUV6RywrQ0FBOEQ7QUFDOUQsdUNBQXdDO0FBR3hDLFNBQWdCLGVBQWUsQ0FBQyxJQUFzRTtJQUNyRyxJQUFJLE1BQU0sR0FBOEQsRUFBRSxDQUFDO0lBQzNFLE1BQU0sUUFBUSxHQUFHLENBQUMsS0FBa0MsRUFBRSxPQUFlLEVBQVEsRUFBRTtRQUM5RSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7SUFDakMsQ0FBQyxDQUFBO0lBRUQscUZBQXFGO0lBQ3JGLHFFQUFxRTtJQUNyRSxNQUFNLFFBQVEsR0FBRyxJQUFJLGNBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLElBQUksRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FDbEYsZ0NBQWdDLEdBQUcsNkJBQTZCLENBQ2hFLENBQUMsQ0FBQztJQUdILE1BQU0sMENBQTBDLEdBQUcsS0FBSyxFQUFFLElBQVksRUFBRSxPQUFlLEVBQUUsS0FBYSxFQUFFLFNBQWlCLEVBQUUsRUFBRSxDQUFDLElBQUEsaUJBQVUsRUFDdkksY0FBUSxDQUFDLFFBQVEsQ0FDaEI7UUFDQyxJQUFJO1FBQ0osSUFBSTtRQUNKO1lBQ0MsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQy9CLFNBQVMsRUFDVCxJQUFJLFVBQVUsQ0FBQyxJQUFBLGlCQUFVLEVBQUMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUM3QztZQUNELE1BQU0sSUFBSSxDQUFDLE9BQU8s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