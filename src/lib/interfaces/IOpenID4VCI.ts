import type { CredentialConfigurationSupported, Grant, OpenidCredentialIssuerMetadata } from "wallet-common";

export interface IOpenID4VCI {
	handleCredentialOffer(credentialOfferURL: string): Promise<{ credentialIssuer: string, selectedCredentialConfigurationId: string; grant?: Grant }>;
	getAvailableCredentialConfigurations(credentialIssuerIdentifier: string): Promise<Record<string, CredentialConfigurationSupported>>;
	generateAuthorizationRequest(credentialIssuerIdentifier: string, credentialConfigurationId: string, grant: Grant ): Promise<{ url?: string; issuerMetadata?: OpenidCredentialIssuerMetadata; credentialConfigurationId?: string }>;
	handleAuthorizationResponse(url: string, dpopNonceHeader?: string): Promise<void>;
	requestCredentialsWithPreAuthorization(credentialIssuer: string, selectedCredentialConfigurationId: string, preAuthorizedCode: string, txCodeInput?: string): Promise<{ url?: string; issuerMetadata?: OpenidCredentialIssuerMetadata; credentialConfigurationId?: string; }>;
}
