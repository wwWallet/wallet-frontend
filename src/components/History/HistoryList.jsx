import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useScreenType from '../../hooks/useScreenType';
import { formatDate } from '../../functions/DateFormat';
import { H3 } from '../Shared/Heading';
import HistoryDetailPopup from '../Popups/HistoryDetailPopup';

// Context
import SessionContext from '@/context/SessionContext';
import useFetchPresentations from '@/hooks/useFetchPresentations';
import { compareBy } from '@/util';

const HistoryList = ({ batchId = null, title = '', limit = null }) => {
	const { keystore } = useContext(SessionContext);

	const [isImageModalOpen, setImageModalOpen] = useState(false);
	const screenType = useScreenType();
	const navigate = useNavigate();

	const history = useFetchPresentations(keystore, batchId, null);

	const [selectedHistoryItemFilteredByBatchId, setSelectedHistoryItemFilteredByBatchId] = useState(null);
	const [selectedHistoryItemFilteredByTransactionId, setSelectedHistoryItemFilteredByTransactionId] = useState(null);
	useEffect(() => {
		if (batchId !== null && history !== null && Object.values(history).length > 0) {
			setSelectedHistoryItemFilteredByBatchId(Object.values(history)[0]);
		}
	}, [batchId, history]);

	const handleHistoryItemClick = async (item) => {
		console.log('extractPresentations', item);
		const transactionId = item[0].presentation.transactionId;
		if (screenType === 'mobile') {
			navigate(`/history/${transactionId}`);
		}
		else {
			setSelectedHistoryItemFilteredByTransactionId(item);
		}
		setImageModalOpen(true);
	};

	return (
		<>
			<div className="py-2 w-full">
				{title && Object.values(history).length > 0 && <H3 heading={title} />}
				<div className="overflow-auto space-y-2" style={{ maxHeight: '85vh' }}>
					{Object.values(history).sort(compareBy(item => -item[0].presentation.timestamp)).map(item => ( // note: an item is an array of presentations (see useFetchPresentations hook)
						<button
							id={`credential-history-item-${item[0].presentation.transactionId}`}
							key={item[0].presentation.transactionId}
							className="bg-gray-50 dark:bg-gray-800 text-sm px-4 py-2 dark:text-white border border-gray-200 shadow-sm dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 break-words w-full text-left"
							style={{ wordBreak: 'break-all' }}
							onClick={() => handleHistoryItemClick(item)}
						>
							<div className="font-bold">{item[0].presentation.audience}</div>
							<div>{formatDate(item[0].presentation.timestamp)}</div>
						</button>
					))}
				</div>
			</div>

			{/* History Detail Popup */}
			<HistoryDetailPopup
				isOpen={isImageModalOpen}
				onClose={() => setImageModalOpen(false)}
				historyItem={
					(selectedHistoryItemFilteredByTransactionId ?
						selectedHistoryItemFilteredByTransactionId :
						(selectedHistoryItemFilteredByBatchId ?
							selectedHistoryItemFilteredByBatchId : []
						)
					)


				}
			/>
		</>
	);
};

export default HistoryList;
