import { TypeMetadata } from "../schemas/SdJwtVcTypeMetadataSchema";
import { Result } from "./Result";
export declare const VctResolutionErrors: {
    readonly InvalidSchema: "invalid_schema";
    readonly NotFound: "not_found";
};
export type VctResolutionError = (typeof VctResolutionErrors)[keyof typeof VctResolutionErrors];
export interface VctDocumentProvider {
    getVctMetadataDocument(vct: string): Promise<Result<TypeMetadata, VctResolutionError>>;
}
export declare const createVctDocumentResolutionEngine: (providers: VctDocumentProvider[]) => VctDocumentProvider;
//# sourceMappingURL=VctDocumentProvider.d.ts.map