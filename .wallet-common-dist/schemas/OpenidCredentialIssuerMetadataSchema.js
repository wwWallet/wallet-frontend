"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenidCredentialIssuerMetadataSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const CredentialConfigurationSupportedSchema_1 = require("./CredentialConfigurationSupportedSchema");
exports.OpenidCredentialIssuerMetadataSchema = zod_1.default.object({
    credential_issuer: zod_1.default.string(),
    credential_endpoint: zod_1.default.string(),
    nonce_endpoint: zod_1.default.string().optional(),
    credential_request_encryption: zod_1.default.object({
        jwks: zod_1.default.object({
            keys: zod_1.default.array(zod_1.default.object({ kid: zod_1.default.string(), }).passthrough()).min(1),
        }),
        enc_values_supported: zod_1.default.array(zod_1.default.string()).min(1),
        zip_values_supported: zod_1.default.array(zod_1.default.string()).min(1).optional(),
        encryption_required: zod_1.default.boolean(),
    }).optional(),
    credential_response_encryption: zod_1.default.object({
        alg_values_supported: zod_1.default.array(zod_1.default.string()).min(1),
        enc_values_supported: zod_1.default.array(zod_1.default.string()).min(1),
        zip_values_supported: zod_1.default.array(zod_1.default.string().min(1)).optional(),
        encryption_required: zod_1.default.boolean(),
    }).optional(),
    authorization_servers: zod_1.default.array(zod_1.default.string()).optional(),
    display: zod_1.default.array(zod_1.default.object({
        name: zod_1.default.string().optional(),
        locale: zod_1.default.string().optional(),
        logo: zod_1.default.object({
            uri: zod_1.default.string(),
            alt_text: zod_1.default.string().optional(),
        }).optional(),
    })).optional(),
    batch_credential_issuance: zod_1.default.object({
        batch_size: zod_1.default.number(),
    }).optional(),
    deferred_credential_endpoint: zod_1.default.string().optional(),
    credential_configurations_supported: zod_1.default.record(CredentialConfigurationSupportedSchema_1.CredentialConfigurationSupportedSchema),
    signed_metadata: zod_1.default.string().optional(), // mdoc-specific property
    mdoc_iacas_uri: zod_1.default.string().optional(), // mdoc-specific property
    notification_endpoint: zod_1.default.string().optional(),
}).passthrough();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiT3BlbmlkQ3JlZGVudGlhbElzc3Vlck1ldGFkYXRhU2NoZW1hLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3NjaGVtYXMvT3BlbmlkQ3JlZGVudGlhbElzc3Vlck1ldGFkYXRhU2NoZW1hLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDhDQUFvQjtBQUNwQixxR0FBa0c7QUFFckYsUUFBQSxvQ0FBb0MsR0FBRyxhQUFDLENBQUMsTUFBTSxDQUFDO0lBQzVELGlCQUFpQixFQUFFLGFBQUMsQ0FBQyxNQUFNLEVBQUU7SUFDN0IsbUJBQW1CLEVBQUUsYUFBQyxDQUFDLE1BQU0sRUFBRTtJQUMvQixjQUFjLEVBQUUsYUFBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUNyQyw2QkFBNkIsRUFBRSxhQUFDLENBQUMsTUFBTSxDQUFDO1FBQ3ZDLElBQUksRUFBRSxhQUFDLENBQUMsTUFBTSxDQUFDO1lBQ2QsSUFBSSxFQUFFLGFBQUMsQ0FBQyxLQUFLLENBQUMsYUFBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEdBQUcsRUFBRSxhQUFDLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztTQUNsRSxDQUFDO1FBQ0Ysb0JBQW9CLEVBQUUsYUFBQyxDQUFDLEtBQUssQ0FBQyxhQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ2hELG9CQUFvQixFQUFFLGFBQUMsQ0FBQyxLQUFLLENBQUMsYUFBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRTtRQUMzRCxtQkFBbUIsRUFBRSxhQUFDLENBQUMsT0FBTyxFQUFFO0tBQ2hDLENBQUMsQ0FBQyxRQUFRLEVBQUU7SUFDYiw4QkFBOEIsRUFBRSxhQUFDLENBQUMsTUFBTSxDQUFDO1FBQ3hDLG9CQUFvQixFQUFFLGFBQUMsQ0FBQyxLQUFLLENBQUMsYUFBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNoRCxvQkFBb0IsRUFBRSxhQUFDLENBQUMsS0FBSyxDQUFDLGFBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDaEQsb0JBQW9CLEVBQUUsYUFBQyxDQUFDLEtBQUssQ0FBQyxhQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFO1FBQzNELG1CQUFtQixFQUFFLGFBQUMsQ0FBQyxPQUFPLEVBQUU7S0FDaEMsQ0FBQyxDQUFDLFFBQVEsRUFBRTtJQUNiLHFCQUFxQixFQUFFLGFBQUMsQ0FBQyxLQUFLLENBQUMsYUFBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFO0lBQ3JELE9BQU8sRUFBRSxhQUFDLENBQUMsS0FBSyxDQUFDLGFBQUMsQ0FBQyxNQUFNLENBQUM7UUFDekIsSUFBSSxFQUFFLGFBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7UUFDM0IsTUFBTSxFQUFFLGFBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7UUFDN0IsSUFBSSxFQUFFLGFBQUMsQ0FBQyxNQUFNLENBQUM7WUFDZCxHQUFHLEVBQUUsYUFBQyxDQUFDLE1BQU0sRUFBRTtZQUNmLFFBQVEsRUFBRSxhQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFO1NBQy9CLENBQUMsQ0FBQyxRQUFRLEVBQUU7S0FDYixDQUFDLENBQUMsQ0FBQyxRQUFRLEVBQUU7SUFDZCx5QkFBeUIsRUFBRSxhQUFDLENBQUMsTUFBTSxDQUFDO1FBQ25DLFVBQVUsRUFBRSxhQUFDLENBQUMsTUFBTSxFQUFFO0tBQ3RCLENBQUMsQ0FBQyxRQUFRLEVBQUU7SUFDYiw0QkFBNEIsRUFBRSxhQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQ25ELG1DQUFtQyxFQUFFLGFBQUMsQ0FBQyxNQUFNLENBQUMsK0VBQXNDLENBQUM7SUFDckYsZUFBZSxFQUFFLGFBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRSx5QkFBeUI7SUFDakUsY0FBYyxFQUFFLGFBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRSx5QkFBeUI7SUFDaEUscUJBQXFCLEVBQUUsYUFBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRTtDQUM1QyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUEifQ==