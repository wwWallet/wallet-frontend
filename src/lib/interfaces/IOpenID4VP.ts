import { ExtendedVcEntity } from "@/context/CredentialsContext";
import { ParsedTransactionData } from "../services/OpenID4VP/TransactionData/parseTransactionData";
import type { HandleAuthorizationRequestError } from "wallet-common";

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
