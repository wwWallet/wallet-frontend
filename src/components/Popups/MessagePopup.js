// MessagePopup.js
import React from 'react';
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import GetButton from '../Buttons/GetButton';

const MessagePopup = ({ type, message, onClose }) => {
	const { title, description } = message || {};
	const { t } = useTranslation();

	const IconComponent = type === 'error' ? FaExclamationCircle : FaCheckCircle;

	const titleColor = type === 'error' ? 'text-red-500' : 'text-green-600';

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50">
			<div className="absolute inset-0 bg-black opacity-50" onClick={() => onClose()}></div>

			<div className="bg-white p-4 rounded-lg shadow-lg w-full lg:w-[33.33%] sm:w-[66.67%] z-10 relative m-4">
				<div className="flex items-start justify-between border-b rounded-t dark:border-gray-600">

					<h2 className={`text-lg font-bold mb-2 flex items-center ${titleColor}`}>
						<IconComponent size={20} className="inline mr-1" />
						{title}
					</h2>
					<button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" onClick={() => onClose()}>
						<svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
							<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
						</svg>
					</button>
				</div>
				<hr className="mb-2 border-t border-primary/80" />
				<p className="mb-2 mt-4">
					{description}
				</p>
				<div className="flex justify-end space-x-2 pt-4">
					<GetButton
						content={t('messagePopup.close')}
						onClick={onClose}
						variant="cancel"
					/>
				</div>
			</div>
		</div>
	);
};

export default MessagePopup;
