import React from 'react';
import { useTranslation } from 'react-i18next';
import HistoryDetailContent from '../History/HistoryDetailContent';
import PopupLayout from './PopupLayout';
import CloseButton from '../Buttons/CloseButton';
import type { PresentationHistoryItem } from '@/hooks/useFetchPresentations';

interface HistoryDetailPopupProps {
	isOpen: boolean;
	onClose: () => void;
	historyItem: PresentationHistoryItem[];
}

const HistoryDetailPopup = ({ isOpen, onClose, historyItem }: HistoryDetailPopupProps) => {
	const { t } = useTranslation();

	return (
		<PopupLayout isOpen={isOpen} onClose={onClose}>
			<div className="flex items-start justify-between mb-2">
				<h2 className="right text-lg font-bold text-lm-gray-900 dark:text-dm-gray-100">
					{t('pageActivity.popupTitle')}
				</h2>
				<CloseButton id="dismiss-history-detail-popup" size="sm" onClick={onClose} />
			</div>
			<hr className="mb-2 border-t border-lm-gray-400 dark:border-dm-gray-600" />

			<HistoryDetailContent historyItem={historyItem} />
		</PopupLayout>
	);
};

export default HistoryDetailPopup;
