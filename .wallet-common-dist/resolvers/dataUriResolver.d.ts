import type { HttpClient, CredentialRendering, CustomCredentialSvgI } from "../interfaces";
import type { ImageDataUriCallback } from "../types";
import type { TypeDisplayEntry, ClaimMetadataEntry } from "../schemas/SdJwtVcTypeMetadataSchema";
import type { CredentialConfigurationSupported } from "../schemas/CredentialConfigurationSupportedSchema";
type IssuerDisplayEntry = NonNullable<NonNullable<CredentialConfigurationSupported["credential_metadata"]>["display"]>[number];
type DataUriResolverOptions = {
    httpClient: HttpClient;
    customRenderer: CustomCredentialSvgI;
    signedClaims?: Record<string, unknown>;
    credentialDisplayArray?: TypeDisplayEntry[];
    issuerDisplayArray?: IssuerDisplayEntry[];
    sdJwtVcRenderer?: CredentialRendering;
    sdJwtVcMetadataClaims?: ClaimMetadataEntry[];
    fallbackName?: string;
};
export declare function dataUriResolver({ customRenderer, signedClaims, credentialDisplayArray, issuerDisplayArray, httpClient, sdJwtVcRenderer, sdJwtVcMetadataClaims, fallbackName, }: DataUriResolverOptions): ImageDataUriCallback;
export {};
//# sourceMappingURL=dataUriResolver.d.ts.map