import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import PopupLayout from './PopupLayout';
import HistoryDetailContent from '../History/HistoryDetailContent';

const HistoryDetailPopup = ({ isOpen, onClose: onCloseProp, matchingCredentials }) => {
	//General
	const { t } = useTranslation();

	//State
	const [isClosing, setIsClosing] = useState(false);

	//Handlers
	const onClose = () => {
		setIsClosing(true);
		setTimeout(() => {
			onCloseProp();
			setIsClosing(false);
		}, 200);
	}

	//Render
	return (
		<PopupLayout isOpen={isOpen} isClosing={isClosing} onClose={onClose}>
			<h2 className="text-xl font-medium text-c-lm-gray-900 dark:text-c-dm-gray-100 mb-6">
				{t('pageHistory.popupTitle')}
			</h2>
			
			<button
				id="dismiss-delete-popup"
				type="button"
				className={`
					absolute top-2 right-2
					bg-c-lm-gray-300 dark:bg-c-dm-gray-800 rounded-lg w-8 h-8 flex justify-center items-center
					hover:bg-c-lm-gray-400 dark:hover:bg-c-dm-gray-700 transition-all duration-150
				`}
				onClick={onClose}
			>
				<FontAwesomeIcon icon={faXmark} className="text-lg text-c-lm-gray-900 dark:text-c-dm-gray-100" />
			</button>

			<HistoryDetailContent historyItem={matchingCredentials} />
		</PopupLayout>
	);
};

export default HistoryDetailPopup;
