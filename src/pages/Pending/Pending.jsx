// External libraries
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Context
import SessionContext from '@/context/SessionContext';

// Hooks
import useFetchPresentations from '../../hooks/useFetchPresentations';

// Components
import { H1 } from '../../components/Shared/Heading';
import PageDescription from '../../components/Shared/PageDescription';
import PendingList from '@/components/Pending/PendingList';


const Pending = () => {
	const { api, keystore } = useContext(SessionContext);

	const { t } = useTranslation();

	const { getCalculatedWalletState } = keystore;
	const [pendingTransactions, setPendingTransactions] = useState(null);

	useEffect(() => {

		if (!getCalculatedWalletState) {
			return;
		}

		const S = getCalculatedWalletState();
		if (!S) {
			return;
		}
		const pendingTransactionsTemp = [];
		for (const session of S.credentialIssuanceSessions) {
			if (!session.credentialEndpoint?.transactionId) {
				pendingTransactionsTemp.push(session);
			}
		}
		setPendingTransactions(pendingTransactionsTemp);
	}, [getCalculatedWalletState, setPendingTransactions]);

	return (
		<div className="px-6 sm:px-12 w-full">
			<H1 heading={t('pagePending.title')} />
			<PageDescription description={t('pagePending.description')} />

			{pendingTransactions && pendingTransactions.length === 0 ? (
				<p className="text-gray-700 dark:text-white mt-4">
					{t('pagePending.noFound')}
				</p>
			) : (
				<PendingList />
			)}
		</div>
	);
};

export default Pending;
