import { z } from "zod";

export const TransactionDataRequestObject = z.object({
	type: z.literal('urn:wwwallet:example_transaction_data_type'),
	credential_ids: z.array(z.string()),
});
