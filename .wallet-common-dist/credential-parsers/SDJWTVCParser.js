"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SDJWTVCParser = SDJWTVCParser;
const core_1 = require("@sd-jwt/core");
const error_1 = require("../error");
const types_1 = require("../types");
const schemas_1 = require("../schemas");
const rendering_1 = require("../rendering");
const getSdJwtVcMetadata_1 = require("../utils/getSdJwtVcMetadata");
const CustomCredentialSvg_1 = require("../functions/CustomCredentialSvg");
const zod_1 = require("zod");
const getIssuerMetadata_1 = require("../utils/getIssuerMetadata");
const convertOpenid4vciToSdjwtvcClaims_1 = require("../functions/convertOpenid4vciToSdjwtvcClaims");
const dataUriResolver_1 = require("../resolvers/dataUriResolver");
const friendlyNameResolver_1 = require("../resolvers/friendlyNameResolver");
const utils_1 = require("../utils");
function SDJWTVCParser(args) {
    const encoder = new TextEncoder();
    function canParseSdJwtVc(raw) {
        const decoder = new TextDecoder();
        if (typeof raw !== "string")
            return false;
        if (raw.includes(".")) {
            const { typ } = JSON.parse(decoder.decode((0, utils_1.fromBase64Url)(raw.split('.')[0])));
            if (typ === types_1.VerifiableCredentialFormat.VC_SDJWT)
                return true;
            if (typ === types_1.VerifiableCredentialFormat.DC_SDJWT)
                return true;
        }
        return false;
    }
    function extractValidityInfo(jwtPayload) {
        let obj = {};
        if (jwtPayload.exp) {
            obj = {
                ...obj,
                validUntil: new Date(jwtPayload.exp * 1000),
            };
        }
        if (jwtPayload.iat) {
            obj = {
                ...obj,
                signed: new Date(jwtPayload.iat * 1000),
            };
        }
        if (jwtPayload.nbf) {
            obj = {
                ...obj,
                validFrom: new Date(jwtPayload.nbf * 1000),
            };
        }
        return obj;
    }
    // Encoding the string into a Uint8Array
    const hasherAndAlgorithm = {
        hasher: (data, alg) => {
            const encoded = typeof data === 'string' ? encoder.encode(data) : new Uint8Array(data);
            return args.context.subtle.digest(alg, encoded).then((v) => new Uint8Array(v));
        },
        alg: 'sha-256',
    };
    const cr = (0, rendering_1.CredentialRenderingService)();
    const renderer = (0, CustomCredentialSvg_1.CustomCredentialSvg)({ httpClient: args.httpClient });
    return {
        async parse({ rawCredential, credentialIssuer }) {
            if (!canParseSdJwtVc(rawCredential)) {
                return {
                    success: false,
                    error: error_1.CredentialParsingError.UnsupportedFormat,
                };
            }
            const warnings = [];
            const { parsedClaims, parsedHeaders, parsedPayload, err } = await (async () => {
                try {
                    const parsedSdJwt = await core_1.SDJwt.fromEncode(rawCredential, hasherAndAlgorithm.hasher);
                    const claims = await parsedSdJwt.getClaims(hasherAndAlgorithm.hasher);
                    const headers = await parsedSdJwt.jwt?.header;
                    const payload = await parsedSdJwt.jwt?.payload;
                    return { parsedClaims: claims, parsedHeaders: headers, parsedPayload: payload, err: null };
                }
                catch (err) {
                    return { parsedClaims: null, parsedHeaders: null, err: err };
                }
            })();
            if (err || !parsedClaims || !parsedHeaders) {
                return {
                    success: false,
                    error: error_1.CredentialParsingError.CouldNotParse,
                };
            }
            const schema = zod_1.z.enum([types_1.VerifiableCredentialFormat.VC_SDJWT, types_1.VerifiableCredentialFormat.DC_SDJWT]);
            const typParseResult = await schema.safeParseAsync(parsedHeaders.typ);
            if (typParseResult.error) {
                return {
                    success: false,
                    error: error_1.CredentialParsingError.NotSupportedCredentialType,
                };
            }
            // sd-jwt vc Payload Schema Validation
            let validatedParsedClaims;
            try {
                validatedParsedClaims = schemas_1.SdJwtVcPayloadSchema.parse(parsedClaims);
            }
            catch (err) {
                return {
                    success: false,
                    error: error_1.CredentialParsingError.InvalidSdJwtVcPayload,
                };
            }
            const { metadata: issuerMetadata } = validatedParsedClaims.iss ? await (0, getIssuerMetadata_1.getIssuerMetadata)(args.httpClient, validatedParsedClaims.iss, warnings) : { metadata: undefined };
            const vctIntegrity = validatedParsedClaims['vct#integrity'];
            const getSdJwtMetadataResult = await (0, getSdJwtVcMetadata_1.getSdJwtVcMetadata)(args.context.vctResolutionEngine, args.context.subtle, args.httpClient, validatedParsedClaims.vct, vctIntegrity, warnings);
            if ('error' in getSdJwtMetadataResult) {
                return {
                    success: false,
                    error: getSdJwtMetadataResult.error,
                };
            }
            let TypeMetadata = {};
            let credentialMetadata = undefined;
            const credentialIssuerMetadata = credentialIssuer?.credentialConfigurationId
                ? issuerMetadata?.credential_configurations_supported?.[credentialIssuer?.credentialConfigurationId]
                : undefined;
            if (getSdJwtMetadataResult.credentialMetadata) {
                credentialMetadata = getSdJwtMetadataResult.credentialMetadata;
            }
            else if ('vctm' in parsedHeaders && Array.isArray(parsedHeaders?.vctm)) {
                const sdjwtvcMetadataDocument = parsedHeaders.vctm.map((encodedMetadataDocument) => JSON.parse(new TextDecoder().decode((0, utils_1.fromBase64)(encodedMetadataDocument)))).filter(((metadataDocument) => metadataDocument.vct === validatedParsedClaims.vct))[0];
                if (sdjwtvcMetadataDocument) {
                    credentialMetadata = sdjwtvcMetadataDocument;
                }
            }
            if (credentialMetadata?.claims) {
                TypeMetadata = { claims: credentialMetadata.claims };
            }
            const friendlyName = (0, friendlyNameResolver_1.friendlyNameResolver)({
                credentialDisplayArray: credentialMetadata?.display,
                issuerDisplayArray: credentialIssuerMetadata?.credential_metadata?.display,
                fallbackName: "SD-JWT Verifiable Credential",
            });
            const dataUri = (0, dataUriResolver_1.dataUriResolver)({
                httpClient: args.httpClient,
                customRenderer: renderer,
                signedClaims: validatedParsedClaims,
                credentialDisplayArray: credentialMetadata?.display,
                issuerDisplayArray: credentialIssuerMetadata?.credential_metadata?.display,
                sdJwtVcRenderer: cr,
                sdJwtVcMetadataClaims: credentialMetadata?.claims,
                fallbackName: "SD-JWT Verifiable Credential",
            });
            if (!TypeMetadata?.claims && credentialIssuerMetadata?.credential_metadata?.claims) {
                const convertedClaims = (0, convertOpenid4vciToSdjwtvcClaims_1.convertOpenid4vciToSdjwtvcClaims)(credentialIssuerMetadata.credential_metadata.claims);
                if (convertedClaims?.length) {
                    TypeMetadata = { claims: convertedClaims };
                }
            }
            return {
                success: true,
                value: {
                    signedClaims: validatedParsedClaims,
                    metadata: {
                        credential: {
                            format: typParseResult.data,
                            vct: validatedParsedClaims?.vct ?? "",
                            TypeMetadata,
                            image: {
                                dataUri: dataUri,
                            },
                            name: friendlyName,
                        },
                        issuer: {
                            id: validatedParsedClaims.iss ?? "UnknownIssuer",
                            name: validatedParsedClaims.iss ?? "UnknownIssuer",
                        }
                    },
                    validityInfo: {
                        ...extractValidityInfo(validatedParsedClaims)
                    },
                    warnings: getSdJwtMetadataResult.warnings
                }
            };
        },
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU0RKV1RWQ1BhcnNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jcmVkZW50aWFsLXBhcnNlcnMvU0RKV1RWQ1BhcnNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQWlCQSxzQ0FxTUM7QUF0TkQsdUNBQXFDO0FBRXJDLG9DQUFrRDtBQUVsRCxvQ0FBdUU7QUFDdkUsd0NBQWtEO0FBQ2xELDRDQUEwRDtBQUMxRCxvRUFBaUU7QUFDakUsMEVBQXVFO0FBQ3ZFLDZCQUF3QjtBQUN4QixrRUFBK0Q7QUFFL0Qsb0dBQWlHO0FBQ2pHLGtFQUErRDtBQUMvRCw0RUFBeUU7QUFDekUsb0NBQXFEO0FBRXJELFNBQWdCLGFBQWEsQ0FBQyxJQUFrRDtJQUMvRSxNQUFNLE9BQU8sR0FBRyxJQUFJLFdBQVcsRUFBRSxDQUFDO0lBRWxDLFNBQVMsZUFBZSxDQUFDLEdBQVk7UUFDcEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQztRQUVsQyxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVE7WUFBRSxPQUFPLEtBQUssQ0FBQztRQUUxQyxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUN2QixNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUEscUJBQWEsRUFBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTdFLElBQUksR0FBRyxLQUFLLGtDQUEwQixDQUFDLFFBQVE7Z0JBQUUsT0FBTyxJQUFJLENBQUM7WUFDN0QsSUFBSSxHQUFHLEtBQUssa0NBQTBCLENBQUMsUUFBUTtnQkFBRSxPQUFPLElBQUksQ0FBQztRQUU5RCxDQUFDO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDZCxDQUFDO0lBRUQsU0FBUyxtQkFBbUIsQ0FBQyxVQUF3RDtR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