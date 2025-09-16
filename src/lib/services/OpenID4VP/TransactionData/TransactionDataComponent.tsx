import React from 'react';
import { TransactionDataRequest } from "./TransactionDataRequest/TransactionDataRequestObject";


export const withTransactionData = (req: TransactionDataRequest) => {
	const TransactionDataComponent: React.FC = () => {
		return (
			<div className="p-2 text-gray-700 text-sm dark:text-white mt-2">
				<span className="text-primary text-sm font-bold dark:text-white block mb-1">
					The verifier requested the acceptance of the example transaction data
				</span>
			</div>
		);
	};

	TransactionDataComponent.displayName = "TransactionDataComponent";
	return TransactionDataComponent;
};
