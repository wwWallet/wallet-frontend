import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRight, faXmark } from '@fortawesome/pro-regular-svg-icons';

import Button from '../Buttons/Button';
import PopupLayout from './PopupLayout';

const RedirectPopup = ({ loading, onClose: onCloseProp, handleContinue, popupTitle, popupMessage }) => {
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
		<PopupLayout isOpen={true} isClosing={isClosing} onClose={onClose} loading={loading}>
			<div className="flex items-start justify-between">
				<div className='flex items-center justify-center w-12 h-12 rounded-full bg-c-lm-gray-300 dark:bg-c-dm-gray-800'>
					<FontAwesomeIcon icon={faArrowUpRight} className="text-xl text-c-lm-gray-900 dark:text-c-dm-gray-100" />
				</div>

				<div className='flex-1 ml-4 mr-12'>
					<h2 className="text-xl font-medium text-c-lm-gray-900 dark:text-c-dm-gray-100">
						{popupTitle}
					</h2>

					<p className="mt-3 text-c-lm-gray-700 dark:text-c-dm-gray-300">
						{popupMessage}
					</p>

					<div className="flex items-center space-x-2 mt-4">
						<Button
							id="continue-redirect-popup"
							variant="tertiary"
							onClick={handleContinue}
							size='md'
							textSize='md'
						>
							{t('common.continue')}
						</Button>

						<Button
							id="cancel-redirect-popup"
							variant="cancel"
							onClick={onClose}
							size='md'
							textSize='md'
						>
							{t('common.cancel')}
						</Button>
					</div>
				</div>

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
			</div>
		</PopupLayout>
	);
};

export default RedirectPopup;
