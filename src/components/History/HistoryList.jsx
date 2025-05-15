import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { extractPresentations } from '@/functions/extractPresentations';

import { formatDate } from '@/functions/DateFormat';

import useScreenType from '@/hooks/useScreenType';

import { H3 } from '@/components/Shared/Heading';
import HistoryDetailPopup from '@/components/Popups/HistoryDetailPopup';

const HistoryList = ({ credentialId = null, history, title = '', limit = null }) => {
	//General
	const navigate = useNavigate();
	const screenType = useScreenType();

	//State
	const [isImageModalOpen, setImageModalOpen] = useState(false);
	const [matchingCredentials, setMatchingCredentials] = useState([]);

	//Data
	const credentialHistory = useMemo(() => {
		if (credentialId === null) {
			return limit !== null ? history.slice(0, limit) : history;
		}
		let filteredHistory = history.filter(histItem => histItem.ivci.includes(credentialId));
		return limit !== null ? filteredHistory.slice(0, limit) : filteredHistory;
	}, [history, credentialId, limit]);

	//Handlers
	const handleHistoryItemClick = async (item) => {
		console.log('extractPresentations', item);
		setMatchingCredentials(extractPresentations(item));
		if (screenType === 'mobile') {
			navigate(`/history/${item.id}`);
		}
		setImageModalOpen(true);
	};

	//Render
	if (credentialHistory.length === 0) {
		return null;
	}

	return (
		<>
			<div className="w-full">
				{title && 
					<H3 heading={title} />
				}

				<div className="overflow-auto">
					{credentialHistory.map((item, index) => (
						<button
							id={`credential-history-item-${item.id}`}
							key={item.id}
							className={`
								text-sm px-6 py-4 ${index > 0 ? 'border-t border-c-lm-gray-300 dark:border-c-dm-gray-600' : ''}
								hover:bg-c-lm-gray-300 dark:hover:bg-c-dm-gray-700 transition-all duration-150 cursor-pointer break-words w-full text-left
							`}
							style={{ wordBreak: 'break-all' }}
							onClick={() => handleHistoryItemClick(item)}
						>
							<h5 className="font-semibold text-c-lm-gray-900 dark:text-c-dm-gray-100">
								{item.audience}
							</h5>

							<p className="mt-0.5 text-c-lm-gray-700 dark:text-c-dm-gray-300">
								{formatDate(item.issuanceDate)}
							</p>
						</button>
					))}
				</div>
			</div>

			{/* History Detail Popup */}
			<HistoryDetailPopup
				isOpen={isImageModalOpen}
				onClose={() => setImageModalOpen(false)}
				matchingCredentials={matchingCredentials}
			/>
		</>
	);
};

export default HistoryList;
