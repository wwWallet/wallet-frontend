import { CredentialConfigurationSupported } from "../schemas/CredentialConfigurationSupportedSchema";

export interface IOpenID4VCIClient {
	handleCredentialOffer(credentialOfferURL: string): Promise<{ credentialIssuer: string, selectedCredentialConfigurationSupported: CredentialConfigurationSupported; }>;
	getAvailableCredentialConfigurations(): Promise<Record<string, CredentialConfigurationSupported>>;
	generateAuthorizationRequest(selectedCredentialConfigurationSupported: CredentialConfigurationSupported, userHandleB64u: string): Promise<{ url: string, client_id: string, request_uri: string }>;
	handleAuthorizationResponse(url: string, dpopNonceHeader?: string): Promise<void>;
}
