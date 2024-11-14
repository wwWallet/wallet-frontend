import z from 'zod';
import { VerifiableCredentialFormat } from './vc';

const proofTypesSupportedSchema = z.object({
	jwt: z.object({
		proof_signing_alg_values_supported: z.array(z.string())
	})
});

const commonSchema = z.object({
	display: z.array(z.object({
		name: z.string(),
		description: z.string().optional(),
		background_color: z.string().optional(),
		text_color: z.string().optional(),
		alt_text: z.string().optional(),
		background_image: z.object({
			uri: z.string()
		}).optional(),
		locale: z.string().optional(),
		logo: z.object({
			uri: z.string(),
			alt_text: z.string().optional(),
		}).optional(),
	})).optional(),
	scope: z.string(),
	cryptographic_binding_methods_supported: z.array(z.string().nonempty()),
	credential_signing_alg_values_supported: z.array(z.string().nonempty()),
	proof_types_supported: proofTypesSupportedSchema,
});

const sdJwtSchema = commonSchema.extend({
	format: z.literal(VerifiableCredentialFormat.SD_JWT_VC),
	vct: z.string()
});


const msoDocSchema = commonSchema.extend({
	format: z.literal(VerifiableCredentialFormat.MSO_MDOC),
	doctype: z.string()
});

export const CredentialConfigurationSupportedSchema = sdJwtSchema.or(msoDocSchema);

export type CredentialConfigurationSupported = z.infer<typeof CredentialConfigurationSupportedSchema>;
