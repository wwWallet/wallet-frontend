import { parseTransactionDataCore, type TransactionDataRequest } from "wallet-common";
import { withTransactionData } from "./TransactionDataComponent";

export type ParsedTransactionData = {
	transaction_data_b64u: string;
	parsed: TransactionDataRequest;
	ui: React.FC;
};

export function parseTransactionData(transaction_data: string[], dcql_query: Record<string, unknown>): ParsedTransactionData[] | null {
	const core = parseTransactionDataCore(transaction_data, dcql_query);
	if (!core) return null;
	return core.map((td) => ({
		...td,
		ui: withTransactionData(td.parsed),
	}));
}
