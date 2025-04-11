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
	const { historyId } = useParams();
	const { api } = useContext(SessionContext);
	const history = useFetchPresentations(api, '', historyId);
	const navigate = useNavigate();
	const [matchingCredentials, setMatchingCredentials] = useState([]);
	const { t } = useTranslation();

	console.log('history', history)

	useEffect(() => {
		if (history.length > 0) {
			setMatchingCredentials(extractPresentations(history[0]));
		}
	}, [history]);

	return (
		<>
			<div className=" sm:px-6">
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
											<p className='text-lg font-bold text-primary dark:text-white'>{history[0].audience} </p>
											<p className='text-sm text-gray-700 dark:text-gray-300'>{formatDate(history[0].issuanceDate)}</p>
										</div>
									</div>
								</>
							)}
						</div>
					</div>

				</div>
				{matchingCredentials.length > 0 && (
					<HistoryDetailContent historyItem={matchingCredentials} />
				)}
			</div>
		</>
	);
};

export default HistoryDetail;
