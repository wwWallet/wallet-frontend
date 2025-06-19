import { fromBase64Url } from "@/util";
import { TransactionDataRequestObject } from "./TransactionDataRequest/TransactionDataRequestObject";

export function parseTransactionData(transaction_data: string[], presentation_definition?: Record<string, unknown>, dcql_query?: Record<string, unknown>) {
	try {
		if (presentation_definition && dcql_query) {
			throw new Error("Only one of presentation_definition or dcql_query should be provided");
		}
		let validCredentialIds: string[] | null = null;

		if (presentation_definition?.input_descriptors instanceof Array) {
			validCredentialIds = presentation_definition.input_descriptors.map(
				(input_desc: { id: string }) => input_desc.id
			);
		} else if (dcql_query?.credentials instanceof Array) {
			validCredentialIds = dcql_query.credentials.map(
				(credential: { id: string }) => credential.id
			);
		}

		const parsedTransactionData = transaction_data.map((td) => ({
			transaction_data_b64u: td,
			parsed: TransactionDataRequestObject.parse(JSON.parse(new TextDecoder().decode(fromBase64Url(td)))),
		}));
		for (const td of parsedTransactionData) {
			if (td.parsed.credential_ids && validCredentialIds) {
				for (const cred_id of td.parsed.credential_ids) {
					if (!validCredentialIds.includes(cred_id)) {
						throw new Error("Transaction data includes invalid credential ids that don't exist in the definition");
					}
				}
			}
		}
		return parsedTransactionData;
	}
	catch (e) {
		console.error(e);
		return "invalid_transaction_data";
	}

}

export interface TransactionDataResponse {
	generateTransactionDataResponseParameters(transaction_data: string[]): Promise<[{
		transaction_data_hashes: string[],
		transaction_data_hashes_alg: string[],
	} | null, Error | null]>;
}
