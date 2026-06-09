"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SDJWTVCVerifier = SDJWTVCVerifier;
const core_1 = require("@sd-jwt/core");
const error_1 = require("../error");
const jose_1 = require("jose");
const util_1 = require("../utils/util");
const verifyCertificate_1 = require("../utils/verifyCertificate");
function SDJWTVCVerifier(args) {
    let errors = [];
    const logError = (error, message) => {
        errors.push({ error, message });
    };
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    // Encoding the string into a Uint8Array
    const hasherAndAlgorithm = {
        hasher: (data, alg) => {
            const encoded = typeof data === 'string' ? encoder.encode(data) : new Uint8Array(data);
            return args.context.subtle.digest(alg, encoded).then((v) => new Uint8Array(v));
        },
        alg: 'sha-256',
    };
    const parse = async (rawCredential) => {
        try {
            const credential = await core_1.SDJwt.fromEncode(rawCredential, hasherAndAlgorithm.hasher);
            const parsedSdJwtWithPrettyClaims = await (await core_1.SDJwt.fromEncode(rawCredential, hasherAndAlgorithm.hasher)).getClaims(hasherAndAlgorithm.hasher);
            return { credential, parsedSdJwtWithPrettyClaims };
        }
        catch (err) {
            if (err instanceof Error) {
                logError(error_1.CredentialVerificationError.InvalidFormat, "Invalid format. Error: " + err.name + ": " + err.message);
            }
            return error_1.CredentialVerificationError.InvalidFormat;
        }
    };
    const getHolderPublicKey = async (rawCredential) => {
        const parseResult = await parse(rawCredential);
        if (parseResult === error_1.CredentialVerificationError.InvalidFormat) {
            return {
                success: false,
                error: error_1.CredentialVerificationError.InvalidFormat,
            };
        }
        const cnf = parseResult.parsedSdJwtWithPrettyClaims.cnf;
        if (cnf?.jwk && parseResult.credential.jwt && parseResult.credential.jwt.header && typeof parseResult.credential.jwt.header["alg"] === 'string') {
            try {
                const holderPublicKey = await (0, jose_1.importJWK)(cnf.jwk, parseResult.credential.jwt.header["alg"]);
                return {
                    success: true,
                    value: holderPublicKey,
                };
            }
            catch (err) {
                logError(error_1.CredentialVerificationError.CannotImportHolderPublicKey, `Error on getHolderPublicKey(): Could not import holder's public key. Cause: ${err.message}`);
                return {
                    success: false,
                    error: error_1.CredentialVerificationError.CannotImportHolderPublicKey,
                };
            }
        }
        return {
            success: false,
            error: error_1.CredentialVerificationError.CannotExtractHolderPublicKey
        };
    };
    const verifyIssuerSignature = async (rawCredential) => {
        const parsedSdJwt = await (async () => {
            try {
                return (await core_1.SDJwt.fromEncode(rawCredential, hasherAndAlgorithm.hasher)).jwt;
            }
            catch (err) {
                if (err instanceof Error) {
                    logError(error_1.CredentialVerificationError.InvalidFormat, "Invalid format. Error: " + err.name + ": " + err.message);
                }
                return error_1.CredentialVerificationError.InvalidFormat;
            }
        })();
        if (parsedSdJwt === error_1.CredentialVerificationError.InvalidFormat) {
            logError(error_1.CredentialVerificationError.InvalidFormat, "Invalid format");
            return {
                success: false,
                error: error_1.CredentialVerificationError.InvalidFormat
            };
        }
        const getIssuerPublicKey = async () => {
            const x5c = parsedSdJwt?.header?.x5c ?? "";
            const alg = parsedSdJwt?.header?.alg ?? "";
            if (x5c && x5c instanceof Array && x5c.length > 0 && typeof alg === 'string') { // extract public key from certificate
                // Only validate certificate chain if not delegating to backend
                // Trust evaluation is now delegated to AuthZEN at the protocol level
                const delegateTrustToBackend = args.context.delegateTrustToBackend ?? true;
                const trustedCertificates = args.context.trustedCertificates ?? [];
                if (!delegateTrustToBackend && trustedCertificates.length > 0) {
                    const lastCertificate = x5c[x5c.length - 1];
                    const lastCertificatePem = `-----BEGIN CERTIFICATE-----\n${lastCertificate}\n-----END CERTIFICATE-----`;
                    const certificateValidationResult = await (0, verifyCertificate_1.verifyCertificate)(lastCertificatePem, trustedCertificates);
                    const lastCertificateIsRootCa = trustedCertificates.map((c) => c.trim()).includes(lastCertificatePem);
                    const rootCertIsTrusted = certificateValidationResult === true || lastCertificateIsRootCa;
                    if (!rootCertIsTrusted) {
                        logError(error_1.CredentialVerificationError.NotTrustedIssuer, "Error on getIssuerPublicKey(): Issuer is not trusted");
                        return {
                            success: false,
                            error: error_1.CredentialVerificationError.NotTrustedIssuer,
                        };
                    }
                }
                try {
                    const issuerPemCert = `-----BEGIN CERTIFICATE-----\n${x5c[0]}\n-----END CERTIFICATE-----`;
                    const issuerPublicKey = await (0, jose_1.importX509)(issuerPemCert, alg);
                    return {
                        success: true,
                        value: issuerPublicKey,
                    };
                }
                catch (err) {
                    logError(error_1.CredentialVerificationError.CannotImportIssuerPublicKey, `Error on getIssuerPublicKey(): Importing key failed because: ${err}`);
                    return {
                        success: false,
                        error: error_1.CredentialVerificationError.CannotImportIssuerPublicKey,
                    };
                }
            }
            if (parsedSdJwt && parsedSdJwt.payload && typeof parsedSdJwt.payload.iss === 'string' && typeof alg === 'string') {
                const publicKeyResolutionResult = await args.pkResolverEngine.resolve({ identifier: parsedSdJwt.payload.iss });
                if (!publicKeyResolutionResult.success) {
                    logError(error_1.CredentialVerificationError.CannotResolveIssuerPublicKey, "CannotResolveIssuerPublicKey");
                    return {
                        success: false,
                        error: error_1.CredentialVerificationError.CannotResolveIssuerPublicKey,
                    };
                }
                try {
                    const publicKey = await (0, jose_1.importJWK)(publicKeyResolutionResult.value.jwk, alg);
                    return {
                        success: true,
                        value: publicKey,
                    };
                }
                catch (err) {
                    logError(error_1.CredentialVerificationError.CannotImportIssuerPublicKey, `Error on getIssuerPublicKey(): Cannot import issuer's public key after resolved from the resolver. Cause ${err.message}`);
                    return {
                        success: false,
                        error: error_1.CredentialVerificationError.CannotImportIssuerPublicKey,
                    };
                }
            }
            logError(error_1.CredentialVerificationError.CannotResolveIssuerPublicKey, "CannotResolveIssuerPublicKey");
            return {
                success: false,
                error: error_1.CredentialVerificationError.CannotResolveIssuerPublicKey,
            };
        };
        const issuerPublicKeyResult = await getIssuerPublicKey();
        if (!issuerPublicKeyResult.success) {
            logError(error_1.CredentialVerificationError.CannotResolveIssuerPublicKey, "CannotResolveIssuerPublicKey");
            return {
                success: false,
                error: issuerPublicKeyResult.error,
            };
        }
        const publicKey = issuerPublicKeyResult.value;
        try {
            await (0, jose_1.jwtVerify)(rawCredential.split('~')[0], publicKey, { clockTolerance: args.context.clockTolerance });
        }
        catch (err) {
            if (err instanceof Error && err.name == "JWTExpired") {
                logError(error_1.CredentialVerificationError.ExpiredCredential, `Error on verifyIssuerSignature(): Credential is expired. Cause: ${err}`);
                return {
                    success: false,
                    error: error_1.CredentialVerificationError.ExpiredCredential,
                };
            }
            logError(error_1.CredentialVerificationError.InvalidSignature, `Error on verifyIssuerSignature(): Issuer signature verification failed. Cause: ${err}`);
            return {
                success: false,
                error: error_1.CredentialVerificationError.InvalidSignature,
            };
        }
        return {
            success: true,
            value: {},
        };
    };
    const verifyKbJwt = async (rawPresentation, opts) => {
        const kbJwt = rawPresentation.split('~')[rawPresentation.split('~').length - 1];
        let temp = rawPresentation.split('~');
        temp = temp.slice(0, temp.length - 1);
        const rawCredentialWithoutKbJwt = temp.join('~') + '~';
        const publicKeyResult = await getHolderPublicKey(rawCredentialWithoutKbJwt);
        if (!publicKeyResult.success) {
            logError(error_1.CredentialVerificationError.CannotExtractHolderPublicKey, "CannotExtractHolderPublicKey");
            return {
                success: false,
                error: publicKeyResult.error,
            };
        }
        const holderPublicKey = publicKeyResult.value;
        const kbJwtDecodedPayload = JSON.parse(decoder.decode((0, util_1.fromBase64Url)(kbJwt.split('.')[1])));
        if (!kbJwtDecodedPayload.sd_hash || !kbJwtDecodedPayload.nonce || !kbJwtDecodedPayload.aud) {
            logError(error_1.CredentialVerificationError.KbJwtVerificationFailedMissingParameters, "Error on verifyKbJwt(): Once of sd_hash, nonce and aud are missing from the kbjwt payload");
            return {
                success: false,
                error: error_1.CredentialVerificationError.KbJwtVerificationFailedMissingParameters,
            };
        }
        const { sd_hash, nonce, aud } = kbJwtDecodedPayload;
        const data = encoder.encode(rawCredentialWithoutKbJwt);
        const hashBuffer = await args.context.subtle.digest('SHA-256', data);
        const calculatedSdHash = (0, util_1.toBase64Url)(hashBuffer);
        if (calculatedSdHash !== sd_hash) {
            logError(error_1.CredentialVerificationError.KbJwtVerificationFailedWrongSdHash, "Error on verifyKbJwt(): Invalid sd_hash");
            return {
                success: false,
                error: error_1.CredentialVerificationError.KbJwtVerificationFailedWrongSdHash,
            };
        }
        if (opts.expectedAudience && opts.expectedAudience !== aud) {
            logError(error_1.CredentialVerificationError.KbJwtVerificationFailedUnexpectedAudience, "Error on verifyKbJwt(): Invalid aud");
            return {
                success: false,
                error: error_1.CredentialVerificationError.KbJwtVerificationFailedUnexpectedAudience,
            };
        }
        if (opts.expectedNonce && opts.expectedNonce !== nonce) {
            logError(error_1.CredentialVerificationError.KbJwtVerificationFailedUnexpectedNonce, "Error on verifyKbJwt(): Invalid nonce");
            return {
                success: false,
                error: error_1.CredentialVerificationError.KbJwtVerificationFailedUnexpectedNonce,
            };
        }
        try {
            await (0, jose_1.jwtVerify)(kbJwt, holderPublicKey, { clockTolerance: args.context.clockTolerance });
        }
        catch (err) {
            logError(error_1.CredentialVerificationError.KbJwtVerificationFailedSignatureValidation, "Error on verifyKbJwt(): Invalid KB-JWT signature");
            return {
                success: false,
                error: error_1.CredentialVerificationError.KbJwtVerificationFailedSignatureValidation,
            };
        }
        return {
            success: true,
            value: {},
        };
    };
    return {
        async verify({ rawCredential, opts }) {
            errors = []; // re-initialize error array
            if (typeof rawCredential !== 'string') {
                return {
                    success: false,
                    error: error_1.CredentialVerificationError.InvalidDatatype,
                };
            }
            // Issuer Signature validation
            const issuerSignatureVerificationResult = await verifyIssuerSignature(rawCredential);
            if (!issuerSignatureVerificationResult.success) {
                return {
                    success: false,
                    error: errors.length > 0 ? errors[0].error : error_1.CredentialVerificationError.UnknownProblem,
                };
            }
            // KB-JWT validation
            if (!rawCredential.endsWith('~')) { // contains kbjwt
                const verifyKbJwtResult = await verifyKbJwt(rawCredential, opts);
                if (!verifyKbJwtResult.success) {
                    return {
                        success: false,
                        error: errors.length > 0 ? errors[0].error : error_1.CredentialVerificationError.UnknownProblem,
                    };
                }
            }
            const publicKeyResult = await getHolderPublicKey(rawCredential);
            if (publicKeyResult.success === false) {
                logError(error_1.CredentialVerificationError.CannotExtractHolderPublicKey, "Could not extract holder public key");
                return {
                    success: false,
                    error: errors.length > 0 ? errors[0].error : error_1.CredentialVerificationError.UnknownProblem,
                };
            }
            return {
                success: true,
                value: {
                    valid: true,
                    holderPublicKey: await (0, jose_1.exportJWK)(publicKeyResult.value),
                },
            };
        },
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU0RKV1RWQ1ZlcmlmaWVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NyZWRlbnRpYWwtdmVyaWZpZXJzL1NESldUVkNWZXJpZmllci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQWVBLDBDQTZUQztBQTVVRCx1Q0FBcUM7QUFHckMsb0NBQXVEO0FBRXZELCtCQUFpRjtBQUNqRix3Q0FBMkQ7QUFDM0Qsa0VBQStEO0FBUS9ELFNBQWdCLGVBQWUsQ0FBQyxJQUE4RjtJQUM3SCxJQUFJLE1BQU0sR0FBOEQsRUFBRSxDQUFDO0lBQzNFLE1BQU0sUUFBUSxHQUFHLENBQUMsS0FBa0MsRUFBRSxPQUFlLEVBQVEsRUFBRTtRQUM5RSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7SUFDakMsQ0FBQyxDQUFBO0lBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQztJQUNsQyxNQUFNLE9BQU8sR0FBRyxJQUFJLFdBQVcsRUFBRSxDQUFDO0lBRWxDLHdDQUF3QztJQUN4QyxNQUFNLGtCQUFrQixHQUFpQjtRQUN4QyxNQUFNLEVBQUUsQ0FBQyxJQUEwQixFQUFFLEdBQVcsRUFBRSxFQUFFO1lBQ25ELE1BQU0sT0FBTyxHQUNaLE9BQU8sSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFeEUsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoRixDQUFDO1FBQ0QsR0FBRyxFQUFFLFNBQVM7S0FDZCxDQUFDO0lBRUYs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