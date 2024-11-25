export interface IOpenID4VPRelyingParty {
	handleAuthorizationRequest(url: string): Promise<{ conformantCredentialsMap: Map<string, string[]>, verifierDomainName: string } | { err: HandleAuthorizationRequestError }>;
	promptForCredentialSelection(conformantCredentialsMap: {[x: string]: string[]}, verifierDomainName: string): Promise<Map<string, string>>;
	sendAuthorizationResponse(selectionMap: Map<string, string>): Promise<{ url?: string }>;
}

export enum HandleAuthorizationRequestError {
	INSUFFICIENT_CREDENTIALS,
	MISSING_PRESENTATION_DEFINITION,
	MISSING_PRESENTATION_DEFINITION_URI,
	NONTRUSTED_VERIFIER,
	INVALID_RESPONSE_MODE,
}
