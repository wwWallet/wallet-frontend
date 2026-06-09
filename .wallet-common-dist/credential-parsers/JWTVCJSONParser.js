"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTVCJSONParser = JWTVCJSONParser;
const error_1 = require("../error");
const types_1 = require("../types");
const JwtVcJsonPayloadSchema_1 = require("../schemas/JwtVcJsonPayloadSchema");
const CustomCredentialSvg_1 = require("../functions/CustomCredentialSvg");
const getIssuerMetadata_1 = require("../utils/getIssuerMetadata");
const convertOpenid4vciToSdjwtvcClaims_1 = require("../functions/convertOpenid4vciToSdjwtvcClaims");
const dataUriResolver_1 = require("../resolvers/dataUriResolver");
const friendlyNameResolver_1 = require("../resolvers/friendlyNameResolver");
const utils_1 = require("../utils");
function JWTVCJSONParser(args) {
    const decoder = new TextDecoder();
    function canParseJwtVcJson(raw) {
        if (typeof raw !== "string")
            return false;
        const parts = raw.split(".");
        if (parts.length !== 3)
            return false;
        // Exclude SD-JWT (contains ~) — the SDJWTVCParser handles those
        if (raw.includes("~"))
            return false;
        try {
            const header = JSON.parse(decoder.decode((0, utils_1.fromBase64Url)(parts[0])));
            // Reject if typ indicates SD-JWT
            if (header.typ === types_1.VerifiableCredentialFormat.VC_SDJWT ||
                header.typ === types_1.VerifiableCredentialFormat.DC_SDJWT) {
                return false;
            }
            // JWT VC JSON must have a vc claim with non-empty type array
            // This prevents matching generic JWTs (ID tokens, access tokens, etc.)
            const payload = JSON.parse(decoder.decode((0, utils_1.fromBase64Url)(parts[1])));
            if (!payload.vc || !Array.isArray(payload.vc.type) || payload.vc.type.length === 0) {
                return false;
            }
            return true;
        }
        catch {
            return false;
        }
    }
    function extractValidityInfo(payload) {
        const obj = {};
        if (payload.exp) {
            obj.validUntil = new Date(payload.exp * 1000);
        }
        if (payload.iat) {
            obj.signed = new Date(payload.iat * 1000);
        }
        if (payload.nbf) {
            obj.validFrom = new Date(payload.nbf * 1000);
        }
        return obj;
    }
    return {
        async parse({ rawCredential, credentialIssuer }) {
            if (!canParseJwtVcJson(rawCredential)) {
                return {
                    success: false,
                    error: error_1.CredentialParsingError.UnsupportedFormat,
                };
            }
            const warnings = [];
            const parts = rawCredential.split(".");
            let header, payload;
            try {
                header = JSON.parse(decoder.decode((0, utils_1.fromBase64Url)(parts[0])));
                payload = JSON.parse(decoder.decode((0, utils_1.fromBase64Url)(parts[1])));
            }
            catch {
                return {
                    success: false,
                    error: error_1.CredentialParsingError.CouldNotParse,
                };
            }
            // Validate header
            const headerResult = JwtVcJsonPayloadSchema_1.JwtVcJsonHeaderSchema.safeParse(header);
            if (!headerResult.success) {
                return {
                    success: false,
                    error: error_1.CredentialParsingError.CouldNotParse,
                };
            }
            // Validate payload
            const payloadResult = JwtVcJsonPayloadSchema_1.JwtVcJsonPayloadSchema.safeParse(payload);
            if (!payloadResult.success) {
                return {
                    success: false,
                    error: error_1.CredentialParsingError.InvalidJwtVcJsonPayload,
                };
            }
            const validatedPayload = payloadResult.data;
            // Extract credential type from vc.type or top-level type
            const vcTypes = validatedPayload.vc?.type ?? [];
            // Fetch issuer metadata if available
            const { metadata: issuerMetadata } = validatedPayload.iss
                ? await (0, getIssuerMetadata_1.getIssuerMetadata)(args.httpClient, validatedPayload.iss, warnings)
                : { metadata: undefined };
            const credentialIssuerMetadata = credentialIssuer?.credentialConfigurationId
                ? issuerMetadata?.credential_configurations_supported?.[credentialIssuer.credentialConfigurationId]
                : undefined;
            let TypeMetadata = {};
            if (credentialIssuerMetadata?.credential_metadata?.claims) {
                const convertedClaims = (0, convertOpenid4vciToSdjwtvcClaims_1.convertOpenid4vciToSdjwtvcClaims)(credentialIssuerMetadata.credential_metadata.claims);
                if (convertedClaims?.length) {
                    TypeMetadata = { claims: convertedClaims };
                }
            }
            const issuerDisplayArray = credentialIssuerMetadata?.credential_metadata?.display;
            const renderer = (0, CustomCredentialSvg_1.CustomCredentialSvg)({ httpClient: args.httpClient });
            const friendlyName = (0, friendlyNameResolver_1.friendlyNameResolver)({
                issuerDisplayArray,
                fallbackName: "JWT Verifiable Credential",
            });
            const dataUri = (0, dataUriResolver_1.dataUriResolver)({
                httpClient: args.httpClient,
                customRenderer: renderer,
                issuerDisplayArray,
                fallbackName: "JWT Verifiable Credential",
            });
            return {
                success: true,
                value: {
                    signedClaims: validatedPayload,
                    metadata: {
                        credential: {
                            format: types_1.VerifiableCredentialFormat.JWT_VC_JSON,
                            type: vcTypes,
                            TypeMetadata,
                            image: {
                                dataUri: dataUri,
                            },
                            name: friendlyName,
                        },
                        issuer: {
                            id: validatedPayload.iss ?? "UnknownIssuer",
                            name: validatedPayload.iss ?? "UnknownIssuer",
                        },
                    },
                    validityInfo: {
                        ...extractValidityInfo(validatedPayload),
                    },
                    warnings: warnings.length > 0 ? warnings : undefined,
                },
            };
        },
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSldUVkNKU09OUGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NyZWRlbnRpYWwtcGFyc2Vycy9KV1RWQ0pTT05QYXJzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFXQSwwQ0E2SkM7QUF4S0Qsb0NBQWtEO0FBRWxELG9DQUEyRjtBQUMzRiw4RUFBa0c7QUFDbEcsMEVBQXVFO0FBQ3ZFLGtFQUErRDtBQUMvRCxvR0FBaUc7QUFDakcsa0VBQStEO0FBQy9ELDRFQUF5RTtBQUN6RSxvQ0FBeUM7QUFFekMsU0FBZ0IsZUFBZSxDQUFDLElBQWtEO0lBQ2pGLE1BQU0sT0FBTyxHQUFHLElBQUksV0FBVyxFQUFFLENBQUM7SUFFbEMsU0FBUyxpQkFBaUIsQ0FBQyxHQUFZO1FBQ3RDLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUTtZQUFFLE9BQU8sS0FBSyxDQUFDO1FBRTFDLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDN0IsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUM7WUFBRSxPQUFPLEtBQUssQ0FBQztRQUVyQyxnRUFBZ0U7UUFDaEUsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQztZQUFFLE9BQU8sS0FBSyxDQUFDO1FBRXBDLElBQUksQ0FBQztZQUNKLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFBLHFCQUFhLEVBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25FLGlDQUFpQztZQUNqQyxJQUNDLE1BQU0sQ0FBQyxHQUFHLEtBQUssa0NBQTBCLENBQUMsUUFBUTtnQkFDbEQsTUFBTSxDQUFDLEdBQUcsS0FBSyxrQ0FBMEIsQ0FBQyxRQUFRLEVBQ2pELENBQUM7Z0JBQ0YsT0FBTyxLQUFLLENBQUM7WUFDZCxDQUFDO1lBRUQsNkRBQTZEO1lB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