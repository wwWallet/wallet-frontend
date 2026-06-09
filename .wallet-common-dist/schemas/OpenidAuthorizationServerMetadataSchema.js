"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenidAuthorizationServerMetadataSchema = void 0;
const zod_1 = require("zod");
exports.OpenidAuthorizationServerMetadataSchema = zod_1.z.object({
    issuer: zod_1.z.string(),
    authorization_endpoint: zod_1.z.string().optional(),
    token_endpoint: zod_1.z.string(),
    pushed_authorization_request_endpoint: zod_1.z.string().optional(),
    authorization_challenge_endpoint: zod_1.z.string().optional(),
    require_pushed_authorization_requests: zod_1.z.boolean().optional(),
    token_endpoint_auth_methods_supported: zod_1.z.array(zod_1.z.string()).optional(),
    token_endpoint_auth_signing_alg_values_supported: zod_1.z.array(zod_1.z.string()).optional(),
    response_types_supported: zod_1.z.array(zod_1.z.string()).optional(),
    code_challenge_methods_supported: zod_1.z.array(zod_1.z.string()).optional(),
    dpop_signing_alg_values_supported: zod_1.z.array(zod_1.z.string()).optional(),
    scopes_supported: zod_1.z.array(zod_1.z.string()).optional(),
    grant_types_supported: zod_1.z.array(zod_1.z.string()).optional(),
    jwks_uri: zod_1.z.string().optional(),
    "pre-authorized_grant_anonymous_access_supported": zod_1.z.boolean().optional()
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiT3BlbmlkQXV0aG9yaXphdGlvblNlcnZlck1ldGFkYXRhU2NoZW1hLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3NjaGVtYXMvT3BlbmlkQXV0aG9yaXphdGlvblNlcnZlck1ldGFkYXRhU2NoZW1hLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZCQUF3QjtBQUVYLFFBQUEsdUNBQXVDLEdBQUcsT0FBQyxDQUFDLE1BQU0sQ0FBQztJQUMvRCxNQUFNLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRTtJQUNsQixzQkFBc0IsRUFBRSxPQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQzdDLGNBQWMsRUFBRSxPQUFDLENBQUMsTUFBTSxFQUFFO0lBQzFCLHFDQUFxQyxFQUFFLE9BQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLEVBQUU7SUFDNUQsZ0NBQWdDLEVBQUUsT0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsRUFBRTtJQUN2RCxxQ0FBcUMsRUFBRSxPQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQzdELHFDQUFxQyxFQUFFLE9BQUMsQ0FBQyxLQUFLLENBQUMsT0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFO0lBQ3JFLGdEQUFnRCxFQUFFLE9BQUMsQ0FBQyxLQUFLLENBQUMsT0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFO0lBQ2hGLHdCQUF3QixFQUFFLE9BQUMsQ0FBQyxLQUFLLENBQUMsT0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFO0lBQ3hELGdDQUFnQyxFQUFFLE9BQUMsQ0FBQyxLQUFLLENBQUMsT0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFO0lBQ2hFLGlDQUFpQyxFQUFFLE9BQUMsQ0FBQyxLQUFLLENBQUMsT0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFO0lBQ2pFLGdCQUFnQixFQUFFLE9BQUMsQ0FBQyxLQUFLLENBQUMsT0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFO0lBQ2hELHFCQUFxQixFQUFFLE9BQUMsQ0FBQyxLQUFLLENBQUMsT0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFO0lBQ3JELFFBQVEsRUFBRSxPQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxFQUFFO0lBQy9CLGlEQUFpRCxFQUFFLE9BQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLEVBQUU7Q0FDekUsQ0FBQyxDQUFDIn0=