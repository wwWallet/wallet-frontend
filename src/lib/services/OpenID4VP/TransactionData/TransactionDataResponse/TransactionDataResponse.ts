import { convertTransactionDataB65uToHash } from "../convertTransactionDataB65uToHash";
import { parseTransactionData } from "../parseTransactionData";

export type TransactionDataResponseParams = {
	transaction_data_hashes: string[],
	transaction_data_hashes_alg: string[],
};

export interface TransactionDataResponseGenerator {
	generateTransactionDataResponse(transaction_data: string[]): Promise<[TransactionDataResponseParams | null, Error | null]>;
}


export type TransactionDataResponseGeneratorParams = {
	descriptor_id: string;
	dcql_query: Record<string, unknown>;
};


export const TransactionDataResponse = ({ descriptor_id, dcql_query }: TransactionDataResponseGeneratorParams): TransactionDataResponseGenerator => {
	return {
		generateTransactionDataResponse: async (transaction_data: string[]) => {
			const parsedTd = parseTransactionData(transaction_data, dcql_query);
			if (parsedTd === null) {
				return [null, new Error("invalid_transaction_data")];
			}
			for (const td of parsedTd) {
				if (td.parsed.credential_ids.includes(descriptor_id)) {
					return [{
						transaction_data_hashes: [await convertTransactionDataB65uToHash(td.transaction_data_b64u)],
						transaction_data_hashes_alg: ["sha-256"],
					}, null]
				}
			}
			return [null, new Error("Couldn't generate transaction data response")];
		},
	}
}
