import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useScreenType from '../../hooks/useScreenType';
import { formatDate } from '../../functions/DateFormat';
import { H3 } from '../Shared/Heading';
import HistoryDetailPopup from '../Popups/HistoryDetailPopup';

// Context
import SessionContext from '@/context/SessionContext';
import useFetchPresentations from '@/hooks/useFetchPresentations';
import { reverse, compareBy } from '@/util';
import { useOpenID4VCIHelper } from '@/lib/services/OpenID4VCIHelper';

import useFilterItemByLang from '@/hooks/useFilterItemByLang';

const PendingList = ({ batchId = null, title = '', limit = null }) => {
	const { keystore } = useContext(SessionContext);

	const [isImageModalOpen, setImageModalOpen] = useState(false);
	const screenType = useScreenType();


	const { getCalculatedWalletState } = keystore;
	const [pendingTransactions, setPendingTransactions] = useState(null);


	const credentialIssuerMetadata = useRef(new Map());
	const helper = useOpenID4VCIHelper();

	const filterItemByLang = useFilterItemByLang();

	const getMetadataFromSession = (session) => {
		const issuerMetadata = credentialIssuerMetadata.current.get(session.credentialIssuerIdentifier);
		if (!issuerMetadata) {
			return null;
		}

		const configuration = issuerMetadata.credential_configurations_supported[session.credentialConfigurationId];
		if (!configuration) {
			return null;
		}
		const issuerDisplayObject = filterItemByLang(issuerMetadata.display, 'locale');
		const credentialDisplayObject = filterItemByLang(configuration.display, 'locale');

		return {
			issuer: {
				...issuerDisplayObject
			},
			credential: {
				...credentialDisplayObject
			},
		}
	}
	useEffect(() => {

		if (!getCalculatedWalletState) {
			return;
		}

		const S = getCalculatedWalletState();
		if (!S) {
			return;
		}
		(async function () {
			const pendingTransactionsTemp = [];
			for (const session of S.credentialIssuanceSessions) {
				if (session.credentialEndpoint?.transactionId) {
					const { metadata } = await helper.getCredentialIssuerMetadata(session.credentialIssuerIdentifier);
					credentialIssuerMetadata.current.set(session.credentialIssuerIdentifier, metadata);
					pendingTransactionsTemp.push(session);
				}
			}
			setPendingTransactions(pendingTransactionsTemp);

		})();

	}, [getCalculatedWalletState, setPendingTransactions, helper]);


	return (
		<>
			<div className="py-2 w-full">
				{title && pendingTransactions.length > 0 && <H3 heading={title} />}
				<div className="overflow-auto space-y-2" style={{ maxHeight: '85vh' }}>
					{pendingTransactions && pendingTransactions
						.sort(reverse(compareBy(pendingTransaction => pendingTransaction.created)))
						.slice(0, limit ?? pendingTransactions.length)
						.map(pendingTransaction => (
							<button
								id={`credential-history-item-${pendingTransaction.credentialEndpoint.transactionId}`}
								key={pendingTransaction.credentialEndpoint.transactionId}
								className="bg-gray-50 dark:bg-gray-800 text-sm px-4 py-2 dark:text-white border border-gray-200 shadow-sm dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 break-words w-full text-left"
								style={{ wordBreak: 'break-all' }}
								onClick={() => { }}
							>
								<div className="font-bold">{`${getMetadataFromSession(pendingTransaction).credential.name} - ${getMetadataFromSession(pendingTransaction).issuer.name}`}</div>
								<div>{formatDate(pendingTransaction.created)}</div>
							</button>
						))}
				</div>
			</div>

		</>
	);
};

export default PendingList;
