export interface IOpenID4VPRelyingParty {
	handleAuthorizationRequest(url: string): Promise<{ conformantCredentialsMap: Map<string, string[]>, verifierDomainName: string } | { err: HandleAuthorizationRequestError }>;
	sendAuthorizationResponse(selectionMap: Map<string, string>): Promise<{ url?: string }>;
}

export enum HandleAuthorizationRequestError {
	INSUFFICIENT_CREDENTIALS,
	MISSING_PRESENTATION_DEFINITION,
	MISSING_PRESENTATION_DEFINITION_URI,
	ONLY_ONE_INPUT_DESCRIPTOR_IS_SUPPORTED,
	NONTRUSTED_VERIFIER,
	INVALID_RESPONSE_MODE,
}
