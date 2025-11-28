import React from 'react';
import { useTranslation } from 'react-i18next';
import HistoryDetailContent from '../History/HistoryDetailContent';
import PopupLayout from './PopupLayout';
import Button from '../Buttons/Button';

const HistoryDetailPopup = ({ isOpen, onClose, historyItem }) => {
	const { t } = useTranslation();

	return (
		<PopupLayout isOpen={isOpen} onClose={onClose}>
			<div className="flex items-start justify-between mb-2">
				<h2 className="right text-lg font-bold text-lm-gray-900 dark:text-dm-gray-100">
					{t('pageHistory.popupTitle')}
				</h2>
				<Button
					id="dismiss-history-detail-popup"
					square={true}
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
				</Button>
			</div>
			<hr className="mb-2 border-t border-lm-gray-400 dark:border-dm-gray-600" />

			<HistoryDetailContent historyItem={historyItem} />
		</PopupLayout>
	);
};

export default HistoryDetailPopup;
