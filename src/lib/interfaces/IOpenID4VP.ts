export interface IOpenID4VP {
	handleAuthorizationRequest(url: string): Promise<{ conformantCredentialsMap: Map<string, string[]>, verifierDomainName: string } | { error: HandleAuthorizationRequestError }>;
	promptForCredentialSelection(conformantCredentialsMap: { [x: string]: string[] }, verifierDomainName: string, verifierPurpose: string): Promise<Map<string, string>>;
	sendAuthorizationResponse(selectionMap: Map<string, string>): Promise<{ url?: string } | { presentation_during_issuance_session: string }>;
}

export enum HandleAuthorizationRequestError {
	NON_SUPPORTED_CLIENT_ID_SCHEME = "non_supported_client_id_scheme",
	INSUFFICIENT_CREDENTIALS = "insufficient_credentials",
	MISSING_PRESENTATION_DEFINITION = "missing_presentation_definition",
	MISSING_PRESENTATION_DEFINITION_URI = "missing_presentation_definition_uri",
	NONTRUSTED_VERIFIER = "nontrusted_verifier",
	INVALID_RESPONSE_MODE = "invalid_response_mode",
	OLD_STATE = "old_state",
	INVALID_TRANSACTION_DATA = "invalid_transaction_data",
	INVALID_TYP = "invalid_jwt_typ",
}
