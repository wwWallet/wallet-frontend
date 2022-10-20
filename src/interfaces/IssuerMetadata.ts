export interface IssuerMetadata {
	issuer: string,
	authorization_endpoint: string,
	token_endpoint: string,
	credential_endpoint: string,
	credentials_supported: any,
	credential_issuer: {
		id: string,
		display: any[]
	}
}
