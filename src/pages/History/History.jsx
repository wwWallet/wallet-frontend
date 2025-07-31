// External libraries
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

// Context
import SessionContext from '@/context/SessionContext';

// Hooks
import useFetchPresentations from '../../hooks/useFetchPresentations';

// Components
import { H1 } from '../../components/Shared/Heading';
import HistoryList from '../../components/History/HistoryList';
import PageDescription from '../../components/Shared/PageDescription';

const History = () => {
	const { api, keystore } = useContext(SessionContext);
	const history = useFetchPresentations(keystore);

	const { t } = useTranslation();

	return (
		<div className="sm:px-6 w-full">
			<H1 heading={t('common.navItemHistory')} />
			<PageDescription description={t('pageHistory.description')} />

			{history.length === 0 ? (
				<p className="text-gray-700 dark:text-white mt-4">
					{t('pageHistory.noFound')}
				</p>
			) : (
				<HistoryList />
			)}
		</div>
	);
};

export default History;
