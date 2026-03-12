import { z } from 'zod';
import { TransformKeysToLowercase } from './utils/resources';

/**
 * Vite-specific environment variables.
 * These can't or shouldn't be set at runtime.
*/
export const ViteEnvConfigSchema = z.object({
	HOST: z.string().optional(),
	PORT: z.string().optional(),
	GENERATE_SOURCEMAP: z.string().optional(),
	APP_VERSION: z.string().optional(),
});
export type ViteEnvConfig = z.infer<typeof ViteEnvConfigSchema>;

/**
 * Exposed to the client as meta tags and used for generating config files.
 * These can be set at runtime and may differ between tenants in a multi-tenancy setup.
 */
export const ClientEnvConfigSchema = z.object({
	// Runtime base path. Used for asset loading.
	BASE_PATH: z.string().optional().default('/'),

	// If in a multi-tenancy setup, these *should* likely differ between tenants.
	STATIC_PUBLIC_URL: z.string().optional(),
	STATIC_NAME: z.string().optional(),
	I18N_WALLET_NAME_OVERRIDE: z.string().optional(),
	OPENID4VCI_REDIRECT_URI: z.string().optional(),

	// If in a multi-tenancy setup, these *should not* likely differ between tenants.
	WS_URL: z.string().optional(),
	WALLET_BACKEND_URL: z.string().optional(),
	LOGIN_WITH_PASSWORD: z.string().optional(),
	DID_KEY_VERSION: z.string().optional(),
	DISPLAY_CONSOLE: z.string().optional(),
	WEBAUTHN_RPID: z.string().optional(),
	OPENID4VCI_PROOF_TYPE_PRECEDENCE: z.string().optional(),
	OPENID4VP_SAN_DNS_CHECK: z.string().optional(),
	OPENID4VP_SAN_DNS_CHECK_SSL_CERTS: z.string().optional(),
	VALIDATE_CREDENTIALS_WITH_TRUST_ANCHORS: z.string().optional(),
	MULTI_LANGUAGE_DISPLAY: z.string().optional(),
	FOLD_EVENT_HISTORY_AFTER_SECONDS: z.string().optional(),
	DISPLAY_ISSUANCE_WARNINGS: z.string().optional(),
	OPENID4VCI_MAX_ACCEPTED_BATCH_SIZE: z.string().optional(),
	OPENID4VCI_TRANSACTION_ID_POLLING_INTERVAL_IN_SECONDS: z.string().optional(),
	OPENID4VCI_TRANSACTION_ID_LIFETIME_IN_SECONDS: z.string().optional(),
	OHTTP_KEY_CONFIG: z.string().optional(),
	OHTTP_RELAY: z.string().optional(),
	VCT_REGISTRY_URL: z.string().optional(),
	POLICY_LINKS: z.string().optional(),
	POWERED_BY: z.string().optional(),
});
export type ClientEnvConfig = z.infer<typeof ClientEnvConfigSchema>;

/**
 * Data for well-known files.
 */
export const WellKnownEnvConfigSchema = z.object({
	WELLKNOWN_APPLE_APPIDS: z.string().optional(),
	WELLKNOWN_ANDROID_PACKAGE_NAMES_AND_FINGERPRINTS: z.string().optional(),
});
export type WellKnownEnvConfig = z.infer<typeof WellKnownEnvConfigSchema>;

/**
 * The full environment configuration map.
 */
export const EnvConfigMapSchema = ViteEnvConfigSchema
	.merge(ClientEnvConfigSchema)
	.merge(WellKnownEnvConfigSchema);
export type EnvConfigMap = z.infer<typeof EnvConfigMapSchema>;

/**
 * Client configuration meta tags that will be injected into the HTML.
 */
export const ClientMetaConfigSchema = transformSchemaKeysToLowercase(ClientEnvConfigSchema).extend({
	branding: z.object({
		logo_light: z.string().optional(),
		logo_dark: z.string().optional(),
	}).optional(),
});
export type ClientMetaConfig = z.infer<typeof ClientMetaConfigSchema>;

/**
 * Extracts the client meta configuration from the full environment configuration.
 */
export function getMetaConfigFromEnvConfig(config: EnvConfigMap): ClientMetaConfig {
	return ClientMetaConfigSchema.parse(
		Object.fromEntries(
			Object.entries(config).map(([key, value]) => [key.toLowerCase(), value])
		)
	);
}

/**
 * Transforms a Zod object schema's keys to lowercase.
 * Returns a properly typed Zod schema.
 */
function transformSchemaKeysToLowercase<T extends z.ZodRawShape>(
	schema: z.ZodObject<T>
): z.ZodObject<{ [K in keyof TransformKeysToLowercase<T>]: z.ZodOptional<z.ZodString> }> {
	const shape: Record<string, z.ZodTypeAny> = {};
	for (const [key, value] of Object.entries(schema.shape)) {
		shape[key.toLowerCase()] = value;
	}
	return z.object(shape) as any;
}
