import type { CredentialConfigurationSupported, OpenidCredentialIssuerMetadata } from "wallet-common";

export type TxCodeInputMetadata = {
	input_mode?: 'numeric' | 'text';
	length?: number;
	description?: string;
};

export interface IOpenID4VCI {
	handleCredentialOffer(credentialOfferURL: string): Promise<{ credentialIssuer: string, selectedCredentialConfigurationId: string; issuer_state?: string; txCode?: TxCodeInputMetadata; preAuthorizedCode?: string; }>;
	getAvailableCredentialConfigurations(credentialIssuerIdentifier: string): Promise<Record<string, CredentialConfigurationSupported>>;
	generateAuthorizationRequest(credentialIssuerIdentifier: string, credentialConfigurationId: string, issuer_state?: string): Promise<{ url?: string; issuerMetadata?: OpenidCredentialIssuerMetadata; credentialConfigurationId?: string }>;
	handleAuthorizationResponse(url: string, dpopNonceHeader?: string): Promise<void>;
	requestCredentialsWithPreAuthorization(credentialIssuer: string, selectedCredentialConfigurationId: string, preAuthorizedCode: string, txCodeInput?: string): Promise<{ url?: string; issuerMetadata?: OpenidCredentialIssuerMetadata; credentialConfigurationId?: string; }>;
}
