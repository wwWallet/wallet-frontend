import { ExtendedVcEntity } from "@/context/CredentialsContext";

export interface IOpenID4VP {
	handleAuthorizationRequest(url: string, vcEntitylist: ExtendedVcEntity[]): Promise<{ conformantCredentialsMap: Map<string, any>; verifierDomainName: string, verifierPurpose: string } | { error: HandleAuthorizationRequestError }>;
	promptForCredentialSelection(conformantCredentialsMap: { [x: string]: number[] }, verifierDomainName: string, verifierPurpose: string): Promise<Map<string, number>>;
	sendAuthorizationResponse(selectionMap: Map<string, number>, vcEntitylist: ExtendedVcEntity[]): Promise<{ url?: string } | { presentation_during_issuance_session: string }>;
}

export enum HandleAuthorizationRequestError {
	INSUFFICIENT_CREDENTIALS = "insufficient_credentials",
	MISSING_PRESENTATION_DEFINITION = "missing_presentation_definition",
	MISSING_PRESENTATION_DEFINITION_URI = "missing_presentation_definition_uri",
	NONTRUSTED_VERIFIER = "nontrusted_verifier",
	INVALID_RESPONSE_MODE = "invalid_response_mode",
	OLD_STATE = "old_state",
	INVALID_TRANSACTION_DATA = "invalid_transaction_data",
	INVALID_TYP = "invalid_jwt_typ",
}
