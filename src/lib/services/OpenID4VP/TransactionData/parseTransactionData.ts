import { fromBase64Url } from "@/util";
import { TransactionDataRequestObject } from "./TransactionDataRequest/TransactionDataRequestObject";

export function parseTransactionData(transaction_data: string[], presentation_definition: Record<string, unknown>) {
	try {
		const parsedTransactionData = transaction_data.map((td) => ({
			transaction_data_b64u: td,
			parsed: TransactionDataRequestObject.parse(JSON.parse(new TextDecoder().decode(fromBase64Url(td)))),
		}));
		for (const td of parsedTransactionData) {
			if (td.parsed.credential_ids && presentation_definition.input_descriptors instanceof Array) {
				for (const cred_id of td.parsed.credential_ids) {
					if (!presentation_definition.input_descriptors.map((input_desc: { id: string }) => input_desc.id).includes(cred_id)) {
						throw new Error("Transaction data includes invalid credential ids that don't exist in presentation definition");
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
