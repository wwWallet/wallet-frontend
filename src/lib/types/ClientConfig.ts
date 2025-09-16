import { OpenidAuthorizationServerMetadata, OpenidCredentialIssuerMetadata } from "wallet-common";


export type ClientConfig = {
	clientId: string;
	credentialIssuerIdentifier: string;

	credentialIssuerMetadata: OpenidCredentialIssuerMetadata;
	authorizationServerMetadata: OpenidAuthorizationServerMetadata;
}
