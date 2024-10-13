// External libraries
import React, { useState, useMemo } from 'react';
import Modal from 'react-modal';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

//Hooks
import useScreenType from '../../hooks/useScreenType';

// Utility functions
import { formatDate } from '../../functions/DateFormat';

// Components
import { H3 } from '../Heading';
import HistoryDetailContent from './HistoryDetailContent';

const HistoryList = ({ credentialId = null, history, title = '', limit = null }) => {

	const [matchingCredentials, setMatchingCredentials] = useState([]);
	const [isImageModalOpen, setImageModalOpen] = useState(false);
	const screenType = useScreenType();
	const { t } = useTranslation();
	const navigate = useNavigate();

	const credentialHistory = useMemo(() => {
		if (!credentialId) {
			// If no identifier is provided, return the whole history or up to the limit if specified
			return limit !== null ? history.slice(0, limit) : history;
		}
		// When an identifier is provided, filter based on it
		let filteredHistory = history.filter(histItem => histItem.ivci.includes(credentialId));

		// Apply limit if not null
		if (limit !== null) {
			return filteredHistory.slice(0, limit);
		}
		// Return the filtered list if no limit is set
		return filteredHistory;
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
			<div className="py-2">
				{title && <H3 heading={title} />}
				<div className="my-4 overflow-auto space-y-2" style={{ maxHeight: '85vh' }}>
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
			{isImageModalOpen && (
				<Modal
					isOpen={true}
					onRequestClose={() => { setImageModalOpen(false); }}
					className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-lg m-4 w-full lg:w-1/3 sm:w-2/3 relative"
					overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
				>
					<div className="flex items-start justify-between mb-2 dark:border-gray-600">
						<h2 className="right text-lg font-bold text-primary dark:text-white">
							{t('pageHistory.popupTitle')}
						</h2>
						<button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" onClick={() => { setImageModalOpen(false); }}>
							<svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
								<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
							</svg>
						</button>
					</div>
					<hr className="mb-2 border-t border-primary/80 dark:border-white/80" />

					<HistoryDetailContent historyItem={matchingCredentials} />
				</Modal>

			)}
		</>
	);
};

export default HistoryList;
