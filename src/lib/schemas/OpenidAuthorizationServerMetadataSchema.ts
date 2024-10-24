import { z } from 'zod';

export const OpenidAuthorizationServerMetadataSchema = z.object({
	issuer: z.string(),
	authorization_endpoint: z.string(),
	token_endpoint: z.string(),
	pushed_authorization_request_endpoint: z.string(),
	require_pushed_authorization_requests: z.boolean().optional(),
	token_endpoint_auth_methods_supported: z.array(z.string()),
	response_types_supported: z.array(z.string()),
	code_challenge_methods_supported: z.array(z.string()),
	dpop_signing_alg_values_supported: z.array(z.string()).optional(),
});


export type OpenidAuthorizationServerMetadata = z.infer<typeof OpenidAuthorizationServerMetadataSchema>;
