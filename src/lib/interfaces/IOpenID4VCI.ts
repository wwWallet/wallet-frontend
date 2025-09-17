import { CredentialConfigurationSupported } from "wallet-common";


export interface IOpenID4VCI {
	handleCredentialOffer(credentialOfferURL: string): Promise<{ credentialIssuer: string, selectedCredentialConfigurationId: string; issuer_state?: string }>;
	getAvailableCredentialConfigurations(credentialIssuerIdentifier: string): Promise<Record<string, CredentialConfigurationSupported>>;
	generateAuthorizationRequest(credentialIssuerIdentifier: string, credentialConfigurationId: string, issuer_state?: string): Promise<{ url?: string }>;
	handleAuthorizationResponse(url: string, dpopNonceHeader?: string): Promise<void>;
}
