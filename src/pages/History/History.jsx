// External libraries
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

// Context
import SessionContext from '@/context/SessionContext';

// Hooks
import useFetchPresentations from '../../hooks/useFetchPresentations';

// Components
import ActivityEmptyState from '@/components/History/ActivityEmptyState';
import { H1 } from '../../components/Shared/Heading';
import HistoryList from '../../components/History/HistoryList';
import PageDescription from '../../components/Shared/PageDescription';

const History = () => {
	const { keystore } = useContext(SessionContext);
	const history = useFetchPresentations(keystore);

	const { t } = useTranslation();

	return (
		<div className="px-6 sm:px-12 w-full">
			<H1 heading={t('common.navItemHistory')} />
			<PageDescription description={t('pageHistory.description')} />

			{(history !== null && history.length === 0 ? (
				<ActivityEmptyState />
			) : (
				<HistoryList history={history}/>
			))}
		</div>
	);
};

export default History;
