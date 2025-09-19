import { OpenidAuthorizationServerMetadata, OpenidCredentialIssuerMetadata } from "wallet-common";


export interface IOpenID4VCIAuthorizationRequest {
	generate(credentialConfigurationId: string, issuer_state: string | undefined, config: {
		credentialIssuerIdentifier: string,
		redirectUri: string,
		clientId: string,
		authorizationServerMetadata: OpenidAuthorizationServerMetadata,
		credentialIssuerMetadata: OpenidCredentialIssuerMetadata,
	}): Promise<{ authorizationRequestURL: string } | { authorization_code: string; state: string; }>
}
