import z from 'zod';
import { CredentialConfigurationSupportedSchema } from './CredentialConfigurationSupportedSchema';

export const OpenidCredentialIssuerMetadataSchema = z.object({
	credential_issuer: z.string(),
	credential_endpoint: z.string(),
	display: z.array(z.object({
		name: z.string(),
		locale: z.string(),
	})).optional(),
	credential_configurations_supported: z.record(CredentialConfigurationSupportedSchema)
})


export type OpenidCredentialIssuerMetadata = z.infer<typeof OpenidCredentialIssuerMetadataSchema>;
