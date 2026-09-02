// External libraries
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';

// Context
import SessionContext from '@/context/SessionContext';

// Hooks
import useFetchPresentations from '@/hooks/useFetchPresentations';

// Components
import ActivityEmptyState from '@/components/History/ActivityEmptyState';
import HistoryList from '@/components/History/HistoryList';
import { H1 } from '@/components/Shared/Heading';
import PageDescription from '@/components/Shared/PageDescription';

const Activity = () => {
	const { keystore } = useContext(SessionContext);
	const activity = useFetchPresentations(keystore);
	const { t } = useTranslation();

	return (
		<div className="px-6 sm:px-12 w-full">
			<H1 heading={t('common.navItemActivity')} />
			<PageDescription description={t('pageActivity.description')} />

			{(activity !== null && activity.length === 0 ? (
				<ActivityEmptyState />
			) : (
				<HistoryList history={activity}/>
			))}
		</div>
	);
};

export default Activity;
