import { OpenidAuthorizationServerMetadata } from "wallet-common";
import { OpenidCredentialIssuerMetadata } from "../schemas/OpenidCredentialIssuerMetadataSchema";


export interface IOpenID4VCIAuthorizationRequest {
	generate(credentialConfigurationId: string, issuer_state: string | undefined, config: {
		credentialIssuerIdentifier: string,
		redirectUri: string,
		clientId: string,
		authorizationServerMetadata: OpenidAuthorizationServerMetadata,
		credentialIssuerMetadata: OpenidCredentialIssuerMetadata,
	}): Promise<{ authorizationRequestURL: string } | { authorization_code: string; state: string; }>
}
