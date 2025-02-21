import z from 'zod';
import { CredentialConfigurationSupportedSchema } from './CredentialConfigurationSupportedSchema';

export const OpenidCredentialIssuerMetadataSchema = z.object({
	credential_issuer: z.string(),
	credential_endpoint: z.string(),
	authorization_servers: z.array(z.string()).optional(),
	display: z.array(z.object({
		name: z.string(),
		locale: z.string(),
	})).optional(),
	batch_credential_issuance: z.object({
		batch_size: z.number(),
	}).optional(),
	credential_configurations_supported: z.record(CredentialConfigurationSupportedSchema),
	signed_metadata: z.string().optional(),
})

export type OpenidCredentialIssuerMetadata = z.infer<typeof OpenidCredentialIssuerMetadataSchema>;
