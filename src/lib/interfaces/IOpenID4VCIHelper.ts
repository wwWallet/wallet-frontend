import { OpenidAuthorizationServerMetadata } from "../schemas/OpenidAuthorizationServerMetadataSchema";
import { OpenidCredentialIssuerMetadata } from "../schemas/OpenidCredentialIssuerMetadataSchema";

export interface IOpenID4VCIHelper {
	/**
	 *
	 * @param credentialIssuerIdentifier
	 * @throws
	 */
	getAuthorizationServerMetadata(isOnline: boolean, credentialIssuerIdentifier: string): Promise<{ authzServeMetadata: OpenidAuthorizationServerMetadata }>;


	/**
	 *
	 * @param credentialIssuerIdentifier
	 * @throws
	 */
	getCredentialIssuerMetadata(isOnline: boolean, credentialIssuerIdentifier: string): Promise<{ metadata: OpenidCredentialIssuerMetadata }>;
}
