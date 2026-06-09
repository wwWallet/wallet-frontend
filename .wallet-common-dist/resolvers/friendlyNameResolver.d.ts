import type { FriendlyNameCallback } from "../types";
import type { TypeDisplayEntry } from "../schemas/SdJwtVcTypeMetadataSchema";
import type { CredentialConfigurationSupported } from "../schemas/CredentialConfigurationSupportedSchema";
type IssuerDisplayEntry = NonNullable<NonNullable<CredentialConfigurationSupported["credential_metadata"]>["display"]>[number];
type FriendlyNameResolverOptions = {
    credentialDisplayArray?: TypeDisplayEntry[];
    issuerDisplayArray?: IssuerDisplayEntry[];
    fallbackName?: string;
};
export declare function friendlyNameResolver({ credentialDisplayArray, issuerDisplayArray, fallbackName, }: FriendlyNameResolverOptions): FriendlyNameCallback;
export {};
//# sourceMappingURL=friendlyNameResolver.d.ts.map