import { OpenidAuthorizationServerMetadata } from "../schemas/OpenidAuthorizationServerMetadataSchema";
import { OpenidCredentialIssuerMetadata } from "../schemas/OpenidCredentialIssuerMetadataSchema";

export interface IOpenID4VCIHelper {
	/**
	 *
	 * @param credentialIssuerIdentifier
	 * @throws
	 */
	getAuthorizationServerMetadata(isOnline: boolean, credentialIssuerIdentifier: string, forceIndexDB: boolean): Promise<{ authzServeMetadata: OpenidAuthorizationServerMetadata }>;


	/**
	 *
	 * @param credentialIssuerIdentifier
	 * @throws
	 */
	getCredentialIssuerMetadata(isOnline: boolean, credentialIssuerIdentifier: string, forceIndexDB: boolean): Promise<{ metadata: OpenidCredentialIssuerMetadata }>;
}
