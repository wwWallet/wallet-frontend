// External libraries
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from "react-icons/fa";
import { VerifierIcon } from '@/assets/images/verifier_icon';
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
				<div className="flex flex-col lg:flex-row lg:mt-5 mt-0">
					<div className='flex flex-row'>
						<div className='flex flex-col items-left gap mt-2 px-2'>
							{history.length > 0 && (
								<>
									<div className='flex items-center gap-2'>
										<div className='my-2'>
											<VerifierIcon className="fill-white bg-primary dark:bg-primary-light p-2 w-12 rounded-md" />
										</div>
										<div>
											<p className='text-lg font-bold text-primary dark:text-white'>{Object.values(history)[0].audience} </p>
											<p className='text-sm text-gray-700 dark:text-gray-300'>{formatDate(Object.values(history)[0].presentationTimestampSeconds)}</p>
										</div>
									</div>
								</>
							)}
						</div>
					</div>

				</div>
				{selectedHistoryItem.length > 0 && (
					<HistoryDetailContent historyItem={selectedHistoryItem} />
				)}
			</div>
		</>
	);
};

export default HistoryDetail;
