export interface IOpenID4VP {
	handleAuthorizationRequest(url: string): Promise<{ conformantCredentialsMap: Map<string, string[]>, verifierDomainName: string } | { err: HandleAuthorizationRequestError }>;
	promptForCredentialSelection(conformantCredentialsMap: { [x: string]: string[] }, verifierDomainName: string, verifierPurpose: string): Promise<Map<string, string>>;
	sendAuthorizationResponse(selectionMap: Map<string, string>): Promise<{ url?: string } | { presentation_during_issuance_session: string }>;
}

export enum HandleAuthorizationRequestError {
	INSUFFICIENT_CREDENTIALS,
	MISSING_PRESENTATION_DEFINITION,
	MISSING_PRESENTATION_DEFINITION_URI,
	NONTRUSTED_VERIFIER,
	INVALID_RESPONSE_MODE,
	OLD_STATE,
}
