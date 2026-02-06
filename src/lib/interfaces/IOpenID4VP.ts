import { ExtendedVcEntity } from "@/context/CredentialsContext";
import { ParsedTransactionData } from "../services/OpenID4VP/TransactionData/parseTransactionData";

export interface IOpenID4VP {
	handleAuthorizationRequest(
		url: string,
		vcEntitylist: ExtendedVcEntity[],
	): Promise<
		{
			conformantCredentialsMap: Map<string, any>,
			verifierDomainName: string,
			verifierPurpose: string,
			parsedTransactionData: ParsedTransactionData[] | null,
		}
		| { error: HandleAuthorizationRequestError }
	>;
	promptForCredentialSelection(
		conformantCredentialsMap: { [x: string]: number[] },
		verifierDomainName: string,
		verifierPurpose: string,
		parsedTransactionData?: ParsedTransactionData[],
	): Promise<Map<string, number>>;
	sendAuthorizationResponse(selectionMap: Map<string, number>, vcEntitylist: ExtendedVcEntity[]): Promise<{ url?: string } | { presentation_during_issuance_session: string }>;
}

export enum HandleAuthorizationRequestError {
	NON_SUPPORTED_CLIENT_ID_SCHEME = "non_supported_client_id_scheme",
	INSUFFICIENT_CREDENTIALS = "insufficient_credentials",
	MISSING_DCQL_QUERY = "missing_dcql_query",
	NONTRUSTED_VERIFIER = "nontrusted_verifier",
	INVALID_RESPONSE_MODE = "invalid_response_mode",
	OLD_STATE = "old_state",
	INVALID_TRANSACTION_DATA = "invalid_transaction_data",
	INVALID_TYP = "invalid_jwt_typ",
	COULD_NOT_RESOLVE_REQUEST = "could_not_resolve_request",
}
