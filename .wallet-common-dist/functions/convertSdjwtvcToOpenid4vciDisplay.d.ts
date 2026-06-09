import type { TypeDisplayEntry } from "../schemas/SdJwtVcTypeMetadataSchema";
import type { CredentialConfigurationSupported } from "../schemas/CredentialConfigurationSupportedSchema";
type CredentialMetadata = NonNullable<CredentialConfigurationSupported["credential_metadata"]>;
type OpenIdCredentialDisplay = NonNullable<CredentialMetadata["display"]>;
/**
 * Convert SD-JWT VC TypeMetadata.display -> OpenID4VCI CredentialConfigurationSupported.display
 *
 * Notes:
 * - svg_templates are intentionally ignored
 * - We map:
 *   - name -> name
 *   - description -> description
 *   - rendering.simple.background_color -> background_color
 *   - rendering.simple.text_color -> text_color
 *   - rendering.simple.background_image.uri -> background_image.uri
 *   - rendering.simple.logo -> logo
 *   - locale -> locale
 *
 */
export declare function convertSdjwtvcToOpenid4vciDisplay(display?: TypeDisplayEntry[]): OpenIdCredentialDisplay | undefined;
export {};
//# sourceMappingURL=convertSdjwtvcToOpenid4vciDisplay.d.ts.map