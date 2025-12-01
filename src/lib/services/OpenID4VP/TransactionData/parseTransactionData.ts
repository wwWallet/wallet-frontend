import { fromBase64Url } from "@/util";
import { TransactionDataRequest, TransactionDataRequestObject } from "./TransactionDataRequest/TransactionDataRequestObject";
import { withTransactionData } from "./TransactionDataComponent";


export type ParsedTransactionData = {
	transaction_data_b64u: string;
	parsed: TransactionDataRequest;
	ui: React.FC;
};

export function parseTransactionData(transaction_data: string[], dcql_query: Record<string, unknown>): ParsedTransactionData[] | null {
	try {
		let validCredentialIds: string[] | null = null;

		if (dcql_query?.credentials instanceof Array) {
			validCredentialIds = dcql_query.credentials.map(
				(credential: { id: string }) => credential.id
			);
		}

		const parsedTransactionData = transaction_data.map((td) => {
			const parsed = TransactionDataRequestObject.parse(JSON.parse(new TextDecoder().decode(fromBase64Url(td))));
			return {
				transaction_data_b64u: td,
				parsed: parsed,
				ui: withTransactionData(parsed)
			}
		});
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
		return null;
	}

}
