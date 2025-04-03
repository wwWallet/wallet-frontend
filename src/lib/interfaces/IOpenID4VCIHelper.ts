import { MdocIacasResponse } from "../schemas/MdocIacasResponseSchema";
import { OpenidAuthorizationServerMetadata } from "../schemas/OpenidAuthorizationServerMetadataSchema";
import { OpenidCredentialIssuerMetadata } from "../schemas/OpenidCredentialIssuerMetadataSchema";

export interface IOpenID4VCIHelper {
	getClientId(credentialIssuerIdentifier: string): Promise<{ client_id: string } | null>;
	getAuthorizationServerMetadata(credentialIssuerIdentifier: string): Promise<{ authzServeMetadata: OpenidAuthorizationServerMetadata } | null>;
	getCredentialIssuerMetadata(credentialIssuerIdentifier: string): Promise<{ metadata: OpenidCredentialIssuerMetadata } | null>;
	getMdocIacas(credentialIssuerIdentifier: string): Promise<MdocIacasResponse | null>;
}
