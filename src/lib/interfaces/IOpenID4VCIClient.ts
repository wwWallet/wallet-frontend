import { CredentialConfigurationSupported } from "../schemas/CredentialConfigurationSupportedSchema";

export interface IOpenID4VCIClient {
	handleCredentialOffer(credentialOfferURL: string, userHandleB64u: string): Promise<{ credentialIssuer: string, selectedCredentialConfigurationId: string; issuer_state?: string }>;
	getAvailableCredentialConfigurations(): Promise<Record<string, CredentialConfigurationSupported>>;
	generateAuthorizationRequest(credentialConfigurationId: string, userHandleB64u: string, issuer_state?: string): Promise<{ url?: string, client_id?: string, request_uri?: string }>;
	handleAuthorizationResponse(url: string, userHandleB64U: string, dpopNonceHeader?: string): Promise<void>;
}
