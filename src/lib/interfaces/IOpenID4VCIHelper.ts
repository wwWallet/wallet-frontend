import { MdocIacasResponse } from "../schemas/MdocIacasResponseSchema";
import { OpenidAuthorizationServerMetadata } from "../schemas/OpenidAuthorizationServerMetadataSchema";
import { OpenidCredentialIssuerMetadata } from "../schemas/OpenidCredentialIssuerMetadataSchema";

export interface IOpenID4VCIHelper {
	getClientId(credentialIssuerIdentifier: string): Promise<{ client_id: string } | null>;
	getAuthorizationServerMetadata(credentialIssuerIdentifier: string): Promise<{ authzServeMetadata: OpenidAuthorizationServerMetadata } | null>;
	getCredentialIssuerMetadata(credentialIssuerIdentifier: string, useCache?: boolean): Promise<{ metadata: OpenidCredentialIssuerMetadata } | null>;
	getMdocIacas(credentialIssuerIdentifier: string, metadata?: OpenidCredentialIssuerMetadata, useCache?: boolean): Promise<MdocIacasResponse | null>;
	fetchIssuerMetadataAndCertificates(getIssuers: () => Promise<Record<string, unknown>[]>, onCertificates: (pemCertificates: string[]) => void, shouldUseCache: boolean): Promise<void>;
}
