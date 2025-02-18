import { OpenidAuthorizationServerMetadata } from "../schemas/OpenidAuthorizationServerMetadataSchema";
import { OpenidCredentialIssuerMetadata } from "../schemas/OpenidCredentialIssuerMetadataSchema";

export interface IOpenID4VCIHelper {

	getClientId(credentialIssuerIdentifier: string): Promise<{ client_id: string } | null>;

	/**
	 *
	 * @param credentialIssuerIdentifier
	 * @throws
	 */
	getAuthorizationServerMetadata(credentialIssuerIdentifier: string): Promise<{ authzServeMetadata: OpenidAuthorizationServerMetadata } | null>;


	/**
	 *
	 * @param credentialIssuerIdentifier
	 * @throws
	 */
	getCredentialIssuerMetadata(credentialIssuerIdentifier: string): Promise<{ metadata: OpenidCredentialIssuerMetadata } | null>;
}
