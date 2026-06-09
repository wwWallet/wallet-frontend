import { z } from "zod";
import { OpenidCredentialIssuerMetadataSchema } from "../schemas";
import type { HttpClient } from "../interfaces";
import { MetadataWarning } from "../types";
export declare function getIssuerMetadata(httpClient: HttpClient, issuer: string, warnings: MetadataWarning[], useCache?: boolean): Promise<{
    metadata: z.infer<typeof OpenidCredentialIssuerMetadataSchema> | null;
}>;
//# sourceMappingURL=getIssuerMetadata.d.ts.map