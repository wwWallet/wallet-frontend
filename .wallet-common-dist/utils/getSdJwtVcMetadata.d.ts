import { HttpClient } from '../interfaces';
import { MetadataError, MetadataWarning } from '../types';
import { CredentialParsingError } from '../error';
import { TypeMetadata as TypeMetadataSchema } from "../schemas/SdJwtVcTypeMetadataSchema";
import { VctDocumentProvider } from '../core';
export declare function resolveIssuerMetadata(httpClient: any, issuerUrl: string): Promise<{
    code: CredentialParsingError;
} | undefined>;
export declare function getSdJwtVcMetadata(vctResolutionEngine: VctDocumentProvider | undefined, subtle: SubtleCrypto, httpClient: HttpClient, vct: string, vctIntegrity: string | undefined, warnings?: MetadataWarning[]): Promise<{
    credentialMetadata: TypeMetadataSchema | undefined;
    warnings: MetadataWarning[];
} | MetadataError>;
//# sourceMappingURL=getSdJwtVcMetadata.d.ts.map