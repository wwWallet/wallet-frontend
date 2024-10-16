import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useScreenType from '../../hooks/useScreenType';
import { formatDate } from '../../functions/DateFormat';
import { H3 } from '../Shared/Heading';
import HistoryDetailPopup from '../Popups/HistoryDetailPopup';

const HistoryList = ({ credentialId = null, history, title = '', limit = null }) => {

	const [matchingCredentials, setMatchingCredentials] = useState([]);
	const [isImageModalOpen, setImageModalOpen] = useState(false);
	const screenType = useScreenType();
	const navigate = useNavigate();

	const credentialHistory = useMemo(() => {
		if (credentialId === null) {
			return limit !== null ? history.slice(0, limit) : history;
		}
		let filteredHistory = history.filter(histItem => histItem.ivci.includes(credentialId));
		return limit !== null ? filteredHistory.slice(0, limit) : filteredHistory;
	}, [history, credentialId, limit]);

	const handleHistoryItemClick = async (item) => {
		setMatchingCredentials([item.presentation]);
		if (screenType === 'mobile') {
			navigate(`/history/${item.id}`);
		}
		setImageModalOpen(true);
	};

	if (credentialHistory.length === 0) {
		return null;
	}

	return (
		<>
			<div className="py-2 w-full">
				{title && <H3 heading={title} />}
				<div className="overflow-auto space-y-2" style={{ maxHeight: '85vh' }}>
					{credentialHistory.map(item => (
						<button
							key={item.id}
							className="bg-gray-50 dark:bg-gray-800 text-sm px-4 py-2 dark:text-white border border-gray-200 shadow-sm dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 break-words w-full text-left"
							style={{ wordBreak: 'break-all' }}
							onClick={() => handleHistoryItemClick(item)}
						>
							<div className="font-bold">{item.audience}</div>
							<div>{formatDate(item.issuanceDate)}</div>
						</button>
					))}
				</div>
			</div>

			{/* History Detail Popup */}
			<HistoryDetailPopup
				isOpen={isImageModalOpen}
				onRequestClose={() => setImageModalOpen(false)}
				matchingCredentials={matchingCredentials}
			/>
		</>
	);
};

export default HistoryList;
