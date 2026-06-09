"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialConfigurationSupportedSchema = void 0;
const zod_1 = require("zod");
const types_1 = require("../types");
const proofTypesSupportedSchema = zod_1.z.object({
    jwt: zod_1.z.object({
        proof_signing_alg_values_supported: zod_1.z.array(zod_1.z.string()),
        key_attestations_required: zod_1.z.object({
            key_storage: zod_1.z.array(zod_1.z.enum(["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"])).optional(),
            user_authentication: zod_1.z.array(zod_1.z.enum(["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"])).optional(),
        }).optional(),
    }).passthrough().optional(),
    attestation: zod_1.z.object({
        proof_signing_alg_values_supported: zod_1.z.array(zod_1.z.string()),
        key_attestations_required: zod_1.z.object({
            key_storage: zod_1.z.array(zod_1.z.enum(["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"])).optional(),
            user_authentication: zod_1.z.array(zod_1.z.enum(["iso_18045_high", "iso_18045_moderate", "iso_18045_enhanced-basic", "iso_18045_basic"])).optional(),
        }).optional(),
    }).passthrough().optional(),
}).passthrough();
const OpenIdClaimSchema = zod_1.z.object({
    path: zod_1.z.array(zod_1.z.union([zod_1.z.string(), zod_1.z.null(), zod_1.z.number().int().nonnegative()])).nonempty(),
    mandatory: zod_1.z.boolean().optional(),
    display: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string().optional(),
        locale: zod_1.z.string().optional(),
    })).optional(),
});
const commonSchema = zod_1.z.object({
    credential_metadata: zod_1.z.object({
        display: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            description: zod_1.z.string().optional(),
            background_color: zod_1.z.string().optional(),
            text_color: zod_1.z.string().optional(),
            alt_text: zod_1.z.string().optional(),
            background_image: zod_1.z.object({
                uri: zod_1.z.string()
            }).optional(),
            locale: zod_1.z.string().optional(),
            logo: zod_1.z.object({
                uri: zod_1.z.string(),
                alt_text: zod_1.z.string().optional(),
            }).optional(),
        })).optional(),
        claims: zod_1.z.array(OpenIdClaimSchema).optional(),
    }).optional(),
    scope: zod_1.z.string(),
    cryptographic_binding_methods_supported: zod_1.z.array(zod_1.z.string()).optional(),
    credential_signing_alg_values_supported: zod_1.z.array(zod_1.z.string()).optional(),
    proof_types_supported: proofTypesSupportedSchema.optional(),
}).passthrough();
const sdJwtSchema = commonSchema.extend({
    format: zod_1.z.literal(types_1.VerifiableCredentialFormat.VC_SDJWT).or(zod_1.z.literal(types_1.VerifiableCredentialFormat.DC_SDJWT)),
    vct: zod_1.z.string()
});
const msoDocSchema = commonSchema.extend({
    format: zod_1.z.literal(types_1.VerifiableCredentialFormat.MSO_MDOC),
    doctype: zod_1.z.string(),
    credential_signing_alg_values_supported: zod_1.z.array(zod_1.z.number()).optional(),
});
const jwtVcJsonSchema = commonSchema.extend({
    format: zod_1.z.literal(types_1.VerifiableCredentialFormat.JWT_VC_JSON),
});
exports.CredentialConfigurationSupportedSchema = sdJwtSchema.or(msoDocSchema).or(jwtVcJsonSchema);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ3JlZGVudGlhbENvbmZpZ3VyYXRpb25TdXBwb3J0ZWRTY2hlbWEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2NoZW1hcy9DcmVkZW50aWFsQ29uZmlndXJhdGlvblN1cHBvcnRlZFNjaGVtYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2QkFBd0I7QUFDeEIsb0NBQXNEO0FBRXRELE1BQU0seUJBQXlCLEdBQUcsT0FBQyxDQUFDLE1BQU0sQ0FBQztJQUMxQyxHQUFHLEVBQUUsT0FBQyxDQUFDLE1BQU0sQ0FBQztRQUNiLGtDQUFrQyxFQUFFLE9BQUMsQ0FBQyxLQUFLLENBQUMsT0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3ZELHlCQUF5QixFQUFFLE9BQUMsQ0FBQyxNQUFNLENBQUM7WUFDbkMsV0FBVyxFQUFFLE9BQUMsQ0FBQyxLQUFLLENBQUMsT0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLGdCQUFnQixFQUFFLG9CQUFvQixFQUFFLDBCQUEwQixFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRTtZQUNoSSxtQkFBbUIsRUFBRSxPQUFDLENBQUMsS0FBSyxDQUFDLE9BQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRSxvQkFBb0IsRUFBRSwwQkFBMEIsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUU7U0FDeEksQ0FBQyxDQUFDLFFBQVEsRUFBRTtLQUNiLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDM0IsV0FBVyxFQUFFLE9BQUMsQ0FBQyxNQUFNLENBQUM7UUFDckIsa0NBQWtDLEVBQUUsT0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDdkQseUJBQXlCLEVBQUUsT0FBQyxDQUFDLE1BQU0sQ0FBQztZQUNuQyxXQUFXLEVBQUUsT0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFDLENB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