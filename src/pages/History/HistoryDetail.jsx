// External libraries
import React, { useContext, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

// Contexts
import SessionContext from '@/context/SessionContext';

// Hooks
import useFetchPresentations from '@/hooks/useFetchPresentations';

// Components
import HistoryDetailContent from '@/components/History/HistoryDetailContent';
import { H1 } from '@/components/Shared/Heading';

const ActivityDetail = () => {
	const { transactionId } = useParams();
	const { keystore } = useContext(SessionContext);
	const activity = useFetchPresentations(keystore, null, transactionId);
	const navigate = useNavigate();
	const [selectedActivityItem, setSelectedActivityItem] = useState([]);
	const { t } = useTranslation();

	useEffect(() => {
		if (transactionId && activity && Object.keys(activity).length > 0) {
			setSelectedActivityItem(Object.values(activity)[0]);
		}
	}, [activity, transactionId]);

	return (
		<div className="px-6 sm:px-12 w-full">
			<div className='flex'>
				<button
					id="go-previous"
					onClick={() => navigate(-1)}
					className="mr-2 mb-2"
					aria-label="Go back to the previous page"
				>
					<ArrowLeft size={20} className="text-2xl text-lm-gray-900 dark:text-dm-gray-100" />
				</button>
				<H1 heading={t('pageActivity.presentationDetails.title')} />
			</div>
			{selectedActivityItem.length > 0 && (
				<HistoryDetailContent historyItem={selectedActivityItem} />
			)}
		</div>
	);
};

export default ActivityDetail;
