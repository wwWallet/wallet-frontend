import { OpenidAuthorizationServerMetadata } from "../schemas/OpenidAuthorizationServerMetadataSchema";
import { OpenidCredentialIssuerMetadata } from "../schemas/OpenidCredentialIssuerMetadataSchema";

export type ClientConfig = {
	clientId: string;
	credentialIssuerIdentifier: string;

	credentialIssuerMetadata: OpenidCredentialIssuerMetadata;
	authorizationServerMetadata: OpenidAuthorizationServerMetadata;
}
