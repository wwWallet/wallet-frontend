"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTVCJSONVerifier = JWTVCJSONVerifier;
const error_1 = require("../error");
const types_1 = require("../types");
const jose_1 = require("jose");
const util_1 = require("../utils/util");
const verifyCertificate_1 = require("../utils/verifyCertificate");
function JWTVCJSONVerifier(args) {
    let errors = [];
    const logError = (error, message) => {
        errors.push({ error, message });
    };
    const decoder = new TextDecoder();
    function canVerifyJwtVcJson(raw) {
        if (typeof raw !== "string")
            return false;
        const parts = raw.split(".");
        if (parts.length !== 3)
            return false;
        if (raw.includes("~"))
            return false;
        try {
            const header = JSON.parse(decoder.decode((0, util_1.fromBase64Url)(parts[0])));
            if (header.typ === types_1.VerifiableCredentialFormat.VC_SDJWT ||
                header.typ === types_1.VerifiableCredentialFormat.DC_SDJWT) {
                return false;
            }
            return true;
        }
        catch {
            return false;
        }
    }
    const getHolderPublicKey = async (rawCredential) => {
        const parts = rawCredential.split(".");
        let payload;
        try {
            payload = JSON.parse(decoder.decode((0, util_1.fromBase64Url)(parts[1])));
        }
        catch {
            return { success: false, error: error_1.CredentialVerificationError.InvalidFormat };
        }
        const cnf = payload.cnf;
        if (cnf?.jwk) {
            let header;
            try {
                header = JSON.parse(decoder.decode((0, util_1.fromBase64Url)(parts[0])));
            }
            catch {
                return { success: false, error: error_1.CredentialVerificationError.InvalidFormat };
            }
            try {
                const holderPublicKey = await (0, jose_1.importJWK)(cnf.jwk, header.alg);
                return { success: true, value: holderPublicKey };
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                logError(error_1.CredentialVerificationError.CannotImportHolderPublicKey, `Could not import holder public key: ${message}`);
                return { success: false, error: error_1.CredentialVerificationError.CannotImportHolderPublicKey };
            }
        }
        return { success: false, error: error_1.CredentialVerificationError.CannotExtractHolderPublicKey };
    };
    const verifyIssuerSignature = async (rawCredential) => {
        const parts = rawCredential.split(".");
        let header;
        try {
            header = JSON.parse(decoder.decode((0, util_1.fromBase64Url)(parts[0])));
        }
        catch {
            logError(error_1.CredentialVerificationError.InvalidFormat, "Invalid JWT header");
            return { success: false, error: error_1.CredentialVerificationError.InvalidFormat };
        }
        let payload;
        try {
            payload = JSON.parse(decoder.decode((0, util_1.fromBase64Url)(parts[1])));
        }
        catch {
            logError(error_1.CredentialVerificationError.InvalidFormat, "Invalid JWT payload");
            return { success: false, error: error_1.CredentialVerificationError.InvalidFormat };
        }
        const alg = header.alg;
        // Try x5c certificate chain first
        const getIssuerPublicKey = async () => {
            const x5c = header.x5c;
            if (x5c && x5c instanceof Array && x5c.length > 0 && typeof alg === "string") {
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
                        logError(error_1.CredentialVerificationError.NotTrustedIssuer, "Issuer is not trusted");
                        return { success: false, error: error_1.CredentialVerificationError.NotTrustedIssuer };
                    }
                }
                try {
                    const issuerPemCert = `-----BEGIN CERTIFICATE-----\n${x5c[0]}\n-----END CERTIFICATE-----`;
                    const issuerPublicKey = await (0, jose_1.importX509)(issuerPemCert, alg);
                    return { success: true, value: issuerPublicKey };
                }
                catch (err) {
                    logError(error_1.CredentialVerificationError.CannotImportIssuerPublicKey, `Cannot import issuer public key from x5c: ${err}`);
                    return { success: false, error: error_1.CredentialVerificationError.CannotImportIssuerPublicKey };
                }
            }
            // Try kid / iss resolution via public key resolver
            if (typeof payload.iss === "string" && typeof alg === "string") {
                const publicKeyResolutionResult = await args.pkResolverEngine.resolve({ identifier: payload.iss });
                if (!publicKeyResolutionResult.success) {
                    logError(error_1.CredentialVerificationError.CannotResolveIssuerPublicKey, "CannotResolveIssuerPublicKey");
                    return { success: false, error: error_1.CredentialVerificationError.CannotResolveIssuerPublicKey };
                }
                try {
                    const publicKey = await (0, jose_1.importJWK)(publicKeyResolutionResult.value.jwk, alg);
                    return { success: true, value: publicKey };
                }
                catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    logError(error_1.CredentialVerificationError.CannotImportIssuerPublicKey, `Cannot import resolved issuer public key: ${message}`);
                    return { success: false, error: error_1.CredentialVerificationError.CannotImportIssuerPublicKey };
                }
            }
            logError(error_1.CredentialVerificationError.CannotResolveIssuerPublicKey, "CannotResolveIssuerPublicKey");
            return { success: false, error: error_1.CredentialVerificationError.CannotResolveIssuerPublicKey };
        };
        const issuerPublicKeyResult = await getIssuerPublicKey();
        if (!issuerPublicKeyResult.success) {
            return { success: false, error: issuerPublicKeyResult.error };
        }
        try {
            await (0, jose_1.jwtVerify)(rawCredential, issuerPublicKeyResult.value, {
                clockTolerance: args.context.clockTolerance,
            });
        }
        catch (err) {
            if (err instanceof Error && err.name === "JWTExpired") {
                logError(error_1.CredentialVerificationError.ExpiredCredential, `Credential is expired: ${err}`);
                return { success: false, error: error_1.CredentialVerificationError.ExpiredCredential };
            }
            logError(error_1.CredentialVerificationError.InvalidSignature, `Issuer signature verification failed: ${err}`);
            return { success: false, error: error_1.CredentialVerificationError.InvalidSignature };
        }
        return { success: true, value: {} };
    };
    return {
        async verify({ rawCredential, opts }) {
            errors = [];
            if (!canVerifyJwtVcJson(rawCredential)) {
                return {
                    success: false,
                    error: error_1.CredentialVerificationError.VerificationProcessNotStarted,
                };
            }
            const issuerSignatureResult = await verifyIssuerSignature(rawCredential);
            if (!issuerSignatureResult.success) {
                return {
                    success: false,
                    error: errors.length > 0 ? errors[0].error : error_1.CredentialVerificationError.UnknownProblem,
                };
            }
            const publicKeyResult = await getHolderPublicKey(rawCredential);
            if (!publicKeyResult.success) {
                // Holder binding is optional for jwt_vc_json — return success with empty holderPublicKey
                return {
                    success: true,
                    value: {
                        holderPublicKey: {},
                    },
                };
            }
            return {
                success: true,
                value: {
                    holderPublicKey: await (0, jose_1.exportJWK)(publicKeyResult.value),
                },
            };
        },
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSldUVkNKU09OVmVyaWZpZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY3JlZGVudGlhbC12ZXJpZmllcnMvSldUVkNKU09OVmVyaWZpZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFPQSw4Q0E4TEM7QUFwTUQsb0NBQXVEO0FBQ3ZELG9DQUFvRTtBQUNwRSwrQkFBaUY7QUFDakYsd0NBQThDO0FBQzlDLGtFQUErRDtBQUUvRCxTQUFnQixpQkFBaUIsQ0FBQyxJQUE4RjtJQUMvSCxJQUFJLE1BQU0sR0FBOEQsRUFBRSxDQUFDO0lBQzNFLE1BQU0sUUFBUSxHQUFHLENBQUMsS0FBa0MsRUFBRSxPQUFlLEVBQVEsRUFBRTtRQUM5RSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7SUFDakMsQ0FBQyxDQUFBO0lBRUQsTUFBTSxPQUFPLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQztJQUVsQyxTQUFTLGtCQUFrQixDQUFDLEdBQVk7UUFDdkMsSUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRO1lBQUUsT0FBTyxLQUFLLENBQUM7UUFFMUMsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM3QixJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQztZQUFFLE9BQU8sS0FBSyxDQUFDO1FBQ3JDLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUM7WUFBRSxPQUFPLEtBQUssQ0FBQztRQUVwQyxJQUFJLENBQUM7WUFDSixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBQSxvQkFBYSxFQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuRSxJQUNDLE1BQU0sQ0FBQyxHQUFHLEtBQUssa0NBQTBCLENBQUMsUUFBUTtnQkFDbEQsTUFB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