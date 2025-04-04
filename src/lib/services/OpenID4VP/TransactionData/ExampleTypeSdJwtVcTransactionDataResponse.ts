import { parseTransactionData, TransactionDataResponse } from "./parseTransactionData";
import { toBase64Url } from "@/util";

/**
 * format: sdjwt vc
 * transaction_data type: urn:wwwallet:example_transaction_data_type
 * @param descriptor_id 
 * @returns 
 */
export const ExampleTypeSdJwtVcTransactionDataResponse = (presentation_definition: Record<string, unknown>, descriptor_id: string): TransactionDataResponse => {
	return {
		generateTransactionDataResponseParameters: async (transaction_data: string[]) => {
			const parsedTd = parseTransactionData(transaction_data, presentation_definition);
			if (parsedTd === "invalid_transaction_data") {
				return [null, new Error("invalid_transaction_data")];
			}
			for (const td of parsedTd) {
				if (td.parsed.type === 'urn:wwwallet:example_transaction_data_type' && td.parsed.credential_ids.includes(descriptor_id)) {
					const encoder = new TextEncoder();
					const data = encoder.encode(td.transaction_data_b64u);
					const hashBuffer = await crypto.subtle.digest("SHA-256", data);
					const td_hash = toBase64Url(hashBuffer);
					return [{
						transaction_data_hashes: [ td_hash ],
						transaction_data_hashes_alg: [ "sha-256" ],
					}, null]
				}
			}
			return [null, new Error("Couldn't generate transaction data response for SDJWT and transaction_data type 'urn:wwwallet:example_transaction_data_type'")];
		},
	}
}
