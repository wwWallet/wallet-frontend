// External libraries
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from "react-icons/fa";
import { useTranslation } from 'react-i18next';

// Contexts
import SessionContext from '@/context/SessionContext';

// Utility functions
import { formatDate } from '@/functions/DateFormat';
import { extractPresentations } from '@/functions/extractPresentations';

// Hooks
import useFetchPresentations from '@/hooks/useFetchPresentations';

// Components
import HistoryDetailContent from '@/components/History/HistoryDetailContent';
import { H1 } from '@/components/Shared/Heading';

const HistoryDetail = () => {
	const { transactionId } = useParams();
	const { keystore } = useContext(SessionContext);
	const history = useFetchPresentations(keystore, null, transactionId);
	const navigate = useNavigate();

	// a history item can have more than one presentations (a history item is a transaction)
	const [selectedHistoryItem, setSelectedHistoryItem] = useState([]);
	const { t } = useTranslation();

	console.log('history', history)

	useEffect(() => {
		if (transactionId && history && Object.keys(history).length > 0) {
			setSelectedHistoryItem(Object.values(history)[0]);
		}
	}, [history, transactionId]);

	return (
		<>
			<div className="px-6 sm:px-12 w-full">
				<div className='flex'>
					<button
						id="go-previous"
						onClick={() => navigate(-1)}
						className="mr-2 mb-2"
						aria-label="Go back to the previous page"
					>
						<FaArrowLeft size={20} className="text-2xl text-primary dark:text-white" />
					</button>
					<H1 heading={t('pageHistory.presentationDetails.title')} hr={false} />
				</div>
				{selectedHistoryItem.length > 0 && (
					<HistoryDetailContent historyItem={selectedHistoryItem} />
				)}
			</div>
		</>
	);
};

export default HistoryDetail;
