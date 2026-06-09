import { ClaimMetadataEntry } from "../schemas/SdJwtVcTypeMetadataSchema";
import { OpenIdClaim } from "../schemas";
/**
 * Converts SD-JWT VC type-metadata claims to OpenID4VCI claims.
 * - display[].label -> display[].name
 * - preserves mandatory if present
 * - removes undefined fields
 */
export declare function convertSdjwtvcToOpenid4vciClaims(claims?: ClaimMetadataEntry[] | null): OpenIdClaim[];
export default convertSdjwtvcToOpenid4vciClaims;
//# sourceMappingURL=convertSdjwtvcToOpenid4vciClaims.d.ts.map