// External libraries
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from "react-icons/fa";

// Contexts
import SessionContext from '../../context/SessionContext';

// Utility functions
import { formatDate } from '../../functions/DateFormat';

// Hooks
import useFetchPresentations from '../../hooks/useFetchPresentations';

// Components
import HistoryDetailContent from '../../components/History/HistoryDetailContent';
import { H2, H3 } from '../../components/Heading';

const HistoryDetail = () => {
	const { historyId } = useParams();
	const { api } = useContext(SessionContext);
	const history = useFetchPresentations(api, '', historyId);
	const navigate = useNavigate();
	const [matchingCredentials, setMatchingCredentials] = useState([]);

	useEffect(() => {
		if (history.length>0) {
			const verifiableCredentials = [history[0].presentation];
			setMatchingCredentials(verifiableCredentials);
		}
	}, [history]);

	return (
		<>
			<div className=" sm:px-6">

				<button onClick={() => navigate(-1)} className="mr-2 mb-2" aria-label="Go back to the previous page">
					<FaArrowLeft size={20} className="text-2xl text-primary dark:text-primary-light" />
				</button>
				<div className="flex flex-col lg:flex-row lg:mt-5 mt-0">
					<div className='flex flex-row'>
						<div className='flex flex-col items-left gap mt-2 px-2'>							
							{history.length>0 && (
								<>
									<H2 heading={history[0].audience} hr={false}/>
									<H3 heading={formatDate(history[0].issuanceDate)} hr={false}/>
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
