// External libraries
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

// Contexts
import SessionContext from '@/context/SessionContext';

// Hooks
import useFetchPresentations from '@/hooks/useFetchPresentations';

// Components
import HistoryDetailContent from '@/components/History/HistoryDetailContent';
import PageHeading from '@/components/Shared/PageHeading';

const ActivityDetail = () => {
	const { transactionId } = useParams();
	const { keystore } = useContext(SessionContext);
	const activity = useFetchPresentations(keystore, null, transactionId);
	const [selectedActivityItem, setSelectedActivityItem] = useState([]);
	const { t } = useTranslation();

	useEffect(() => {
		if (transactionId && activity && Object.keys(activity).length > 0) {
			setSelectedActivityItem(Object.values(activity)[0]);
		}
	}, [activity, transactionId]);

	return (
		<div className="px-6 sm:px-12 w-full">
			<PageHeading
				heading={t('pageActivity.presentationDetails.title')}
				backPath="/activity"
				showBackButtonOnDesktop
			/>
			{selectedActivityItem.length > 0 && (
				<HistoryDetailContent historyItem={selectedActivityItem} />
			)}
		</div>
	);
};

export default ActivityDetail;
