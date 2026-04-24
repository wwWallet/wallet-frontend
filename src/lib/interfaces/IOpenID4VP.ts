import { ExtendedVcEntity } from "@/context/CredentialsContext";
import { ParsedTransactionData } from "../services/OpenID4VP/TransactionData/parseTransactionData";

export type SendAuthorizationResponseResult =
	| { type: "skipped" }
	| { type: "redirect", url: string }
	| { type: "success" };

export interface IOpenID4VP {
	handleAuthorizationRequest(
		url: string,
		vcEntitylist: ExtendedVcEntity[],
	): Promise<{
		conformantCredentialsMap: Map<string, any>,
		verifierDomainName: string,
		verifierPurpose: string,
		parsedTransactionData: ParsedTransactionData[] | null,
	}>;
	promptForCredentialSelection(
		conformantCredentialsMap: { [x: string]: number[] },
		verifierDomainName: string,
		verifierPurpose: string,
		parsedTransactionData?: ParsedTransactionData[],
	): Promise<Map<string, number>>;
	sendAuthorizationResponse(
		selectionMap: Map<string, number>,
		vcEntitylist: ExtendedVcEntity[],
	): Promise<SendAuthorizationResponseResult>;
}
