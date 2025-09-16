import { OpenidAuthorizationServerMetadata } from "wallet-common";
import { OpenidCredentialIssuerMetadata } from "../schemas/OpenidCredentialIssuerMetadataSchema";


export type ClientConfig = {
	clientId: string;
	credentialIssuerIdentifier: string;

	credentialIssuerMetadata: OpenidCredentialIssuerMetadata;
	authorizationServerMetadata: OpenidAuthorizationServerMetadata;
}
