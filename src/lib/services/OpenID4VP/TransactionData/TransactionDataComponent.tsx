import React from 'react';
import { TransactionDataRequest } from "./TransactionDataRequest/TransactionDataRequestObject";
import { useTranslation } from "react-i18next";
import document from '../../../../assets/images/document.png';


export const withTransactionData = (req: TransactionDataRequest) => {
	const TransactionDataComponent: React.FC = () => {
		const { t } = useTranslation();

		if (req.type === 'urn:wwwallet:example_transaction_data_type') {
			return (
				<div className="p-2 text-gray-700 text-sm dark:text-white mt-2">
					<span className="text-primary text-sm font-bold dark:text-white block mb-1">
						The verifier requested the acceptance of the example transaction data
					</span>
				</div>
			);
		}
		else if (req.type === 'https://cloudsignatureconsortium.org/2025/qes') {
			return (
				<div className="pd-2 text-gray-700 text-sm dark:text-white mt-2 mb-2">
					<span className="text-primary text-sm font-bold dark:text-white block mb-1">
						{t('selectCredentialPopup.signedDocuments')}
					</span>
					<p></p>
					<div className="flex w-full border rounded-md dark:border-gray-400 bg-c-lm-gray-100 dark:bg-c-dm-gray-900 p-2">
						<div className="w-5/6 flex items-center">
							<ul className="flex flex-col list-disc">
								{req.documentDigests.map((digest, index) => (
									<span className="text-gray-700 dark:text-white text-sm font-bold">
										{digest.label}
									</span>
								))}
							</ul>
						</div>
						<img src={document} alt="signed-doc-icon" className="h-12"></img>
					</div>
				</div>
			)
		}
		else if (req.type === 'https://cloudsignatureconsortium.org/2025/qc-request') {
			return (
				<div className="pd-2 text-gray-700 text-sm dark:text-white mt-2 mb-2">
					<span className="text-primary text-sm font-bold dark:text-white block mb-1">
						{t('selectCredentialPopup.qcRequest')}
					</span>
					<p></p>
				</div>
			)
		}

	};

	TransactionDataComponent.displayName = "TransactionDataComponent";
	return TransactionDataComponent;
};
