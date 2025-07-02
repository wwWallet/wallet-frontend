import type { OpenidAuthorizationServerMetadata, OpenidCredentialIssuerMetadata } from "wallet-common";
import { MdocIacasResponse } from "../schemas/MdocIacasResponseSchema";

export interface IOpenID4VCIHelper {
	getClientId(credentialIssuerIdentifier: string): Promise<{ client_id: string } | null>;
	getAuthorizationServerMetadata(credentialIssuerIdentifier: string): Promise<{ authzServeMetadata: OpenidAuthorizationServerMetadata } | null>;
	getCredentialIssuerMetadata(credentialIssuerIdentifier: string, useCache?: boolean): Promise<{ metadata: OpenidCredentialIssuerMetadata } | null>;
	getMdocIacas(credentialIssuerIdentifier: string, metadata?: OpenidCredentialIssuerMetadata, useCache?: boolean): Promise<MdocIacasResponse | null>;
	fetchIssuerMetadataAndCertificates(getIssuers: () => Promise<Record<string, unknown>[]>, onCertificates: (pemCertificates: string[]) => void, shouldUseCache: boolean, onIssuerMetadataResolved?: (issuerIdentifier: string, metadata: OpenidCredentialIssuerMetadata) => void): Promise<void>;
}
