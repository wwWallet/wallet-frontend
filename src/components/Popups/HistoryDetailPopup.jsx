import React from 'react';
import { useTranslation } from 'react-i18next';
import HistoryDetailContent from '../History/HistoryDetailContent';
import PopupLayout from './PopupLayout';

const HistoryDetailPopup = ({ isOpen, onClose, historyItem }) => {
	const { t } = useTranslation();

	return (
		<PopupLayout isOpen={isOpen} onClose={onClose}>
			<div className="flex items-start justify-between mb-2">
				<h2 className="right text-lg font-bold text-primary dark:text-white">
					{t('pageHistory.popupTitle')}
				</h2>
				<button
					id="dismiss-history-detail-popup"
					type="button"
					className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
					onClick={onClose}
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

			<HistoryDetailContent historyItem={historyItem} />
		</PopupLayout>
	);
};

export default HistoryDetailPopup;
