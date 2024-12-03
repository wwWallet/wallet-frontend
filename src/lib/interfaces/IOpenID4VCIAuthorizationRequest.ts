import { OpenidAuthorizationServerMetadata } from "../schemas/OpenidAuthorizationServerMetadataSchema";
import { OpenidCredentialIssuerMetadata } from "../schemas/OpenidCredentialIssuerMetadataSchema";

export interface IOpenID4VCIAuthorizationRequest {
	generate(credentialConfigurationId: string, userHandleB64u: string, issuer_state: string | undefined, config: {
		credentialIssuerIdentifier: string,
		redirectUri: string,
		clientId: string,
		authorizationServerMetadata: OpenidAuthorizationServerMetadata,
		credentialIssuerMetadata: OpenidCredentialIssuerMetadata,
	}): Promise<{ authorizationRequestURL: string } | { authorization_code: string; state: string; }>
}
