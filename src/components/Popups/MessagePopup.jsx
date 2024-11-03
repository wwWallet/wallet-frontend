// MessagePopup.js
import React from 'react';
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import Button from '../Buttons/Button';
import PopupLayout from './PopupLayout';

const MessagePopup = ({ type, message, onClose }) => {
	const { title, description } = message || {};
	const { t } = useTranslation();

	const IconComponent = type === 'error' ? FaExclamationCircle : FaCheckCircle;
	const color = type === 'error' ? 'red-500' : 'green-500';

	return (
		<PopupLayout isOpen={true} onClose={onClose}>
			<div className="flex items-start justify-between mb-2">
				<h2 className={`text-lg font-bold flex items-center text-${color}`}>
					<IconComponent size={20} className="inline mr-1" />
					{title}
				</h2>
				<button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" onClick={() => onClose()}>
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
				<Button variant="cancel" onClick={onClose}>
					{t('messagePopup.close')}
				</Button>
			</div>
		</PopupLayout>
	);
};

export default MessagePopup;
