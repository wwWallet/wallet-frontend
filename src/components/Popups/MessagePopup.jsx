// MessagePopup.js
import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Buttons/Button';
import PopupLayout from './PopupLayout';
import { CheckCircle, Info } from 'lucide-react';

const MessagePopup = ({ type, message, onClose }) => {
	const { title, description } = message || {};
	const { t } = useTranslation();

	const IconComponent = type === 'error' ? Info : CheckCircle;
	const color = type === 'error' ? 'c-lm-red dark:c-dm-red' : 'c-lm-green dark:c-dm-green';

	return (
		<PopupLayout isOpen={true} onClose={onClose}>
			<div className="flex items-start justify-between mb-2">
				<h2 className={`text-lg font-bold flex items-center text-${color}`}>
					<IconComponent size={20} className="inline mr-1" />
					{title}
				</h2>
				<Button
					id="dismiss-message-popup"
					square={true}
					onClick={() => onClose()}
				>
					<svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
						<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
					</svg>
				</Button>
			</div>
			<hr className={`mb-2 border-t border-${color}/80`} />
			<p className="mb-2 mt-4 dark:text-white">
				{description}
			</p>
			<div className="flex justify-end space-x-2 pt-4">
				<Button
					id="close-message-popup"
					onClick={onClose}
				>
					{t('messagePopup.close')}
				</Button>
			</div>
		</PopupLayout>
	);
};

export default MessagePopup;
