import React from 'react';
import Modal from 'react-modal';
import { useTranslation } from 'react-i18next';
import HistoryDetailContent from '../History/HistoryDetailContent';

const HistoryDetailPopup = ({ isOpen, onRequestClose, matchingCredentials }) => {
	const { t } = useTranslation();

	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={onRequestClose}
			className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-lg m-4 w-full lg:w-1/3 sm:w-2/3 relative"
			overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
		>
			<div className="flex items-start justify-between mb-2 dark:border-gray-600">
				<h2 className="right text-lg font-bold text-primary dark:text-white">
					{t('pageHistory.popupTitle')}
				</h2>
				<button
					type="button"
					className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
					onClick={onRequestClose}
				>
					<svg
						className="w-3 h-3"
						aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 14 14"
					>
						<path
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
						/>
					</svg>
				</button>
			</div>
			<hr className="mb-2 border-t border-primary/80 dark:border-white/80" />

			<HistoryDetailContent historyItem={matchingCredentials} />
		</Modal>
	);
};

export default HistoryDetailPopup;
