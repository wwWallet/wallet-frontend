// MessagePopup.js
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationCircle, faXmark } from '@fortawesome/pro-regular-svg-icons';

import Button from '../Buttons/Button';
import PopupLayout from './PopupLayout';

const MessagePopup = ({ type, message, onClose: onCloseProp }) => {
	//General
	const { t } = useTranslation();

	//Props
	const { title, description } = message || {};

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

	//Prepare for render
	const icon = type === 'error' ? faExclamationCircle : faCheckCircle;
	const bgColor = type === 'error' ? 'bg-c-lm-red-bg dark:bg-c-dm-red-bg-dark' : 'bg-c-lm-gray-300 dark:bg-c-dm-gray-800';
	const color = type === 'error' ? 'text-c-lm-red dark:text-c-dm-red' : 'text-c-lm-green dark:text-c-dm-green';

	//Render
	return (
		<PopupLayout isOpen={true} isClosing={isClosing} onClose={onClose}>
			<div className="flex items-start justify-between">
				<div className={`flex items-center justify-center w-12 h-12 rounded-full ${bgColor}`}>
					<FontAwesomeIcon icon={icon} className={`text-xl ${color}`} />
				</div>

				<div className='flex-1 ml-4 mr-12'>
					<h2 className="text-xl font-medium text-c-lm-gray-900 dark:text-c-dm-gray-100">
						{title}
					</h2>

					<p className="mt-3 text-c-lm-gray-700 dark:text-c-dm-gray-300">
						{description}
					</p>

					<div className="flex items-center space-x-2 mt-4">
						<Button
							id="close-delete-popup"
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
						bg-c-lm-gray-200 dark:bg-c-dm-gray-800 rounded-lg w-8 h-8 flex justify-center items-center
						hover:bg-c-lm-gray-300 dark:hover:bg-c-dm-gray-700 transition-all duration-150
					`}
					onClick={onClose}
				>
					<FontAwesomeIcon icon={faXmark} className="text-lg text-c-lm-gray-900 dark:text-c-dm-gray-100" />
				</button>
			</div>
		</PopupLayout>
	);

	return (
		<PopupLayout isOpen={true} isClosing={isClosing} onClose={onClose}>
			<div className="flex items-start justify-between mb-2">
				<h2 className={`text-lg font-bold flex items-center text-${color}`}>
					
					
					{title}
				</h2>

				<button
					id="dismiss-message-popup"
					type="button"
					className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
					onClick={() => onClose()}
				>
					<svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
						<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
					</svg>
				</button>
			</div>
			<hr className={`mb-2 border-t border-${color}/80`} />
			<p className="mb-2 mt-4 dark:text-white">
				{description}
			</p>
			<div className="flex justify-end space-x-2 pt-4">
				<Button
					id="close-message-popup"
					variant="cancel"
					onClick={onClose}
				>
					{t('messagePopup.close')}
				</Button>
			</div>
		</PopupLayout>
	);
};

export default MessagePopup;
