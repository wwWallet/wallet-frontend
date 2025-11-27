// DeletePopup.js
import React from 'react';
import { useTranslation } from 'react-i18next';
import PopupLayout from './PopupLayout';
import Button from '../Buttons/Button';
import { Trash2 } from 'lucide-react';

const DeletePopup = ({ isOpen, onConfirm, onClose, message, loading }) => {
	const { t } = useTranslation();

	return (
		<PopupLayout isOpen={isOpen} onClose={onClose} loading={loading}>
			<div className="flex items-start justify-between mb-2">
				<h2 className="flex items-center text-lg font-bold text-lm-gray-900 dark:text-dm-gray-50">
					<div className={`inline p-1 rounded-full mr-1 bg-lm-red dark:bg-dm-red text-white`}>
						<Trash2 size={20} />
					</div>
					{t('pageSettings.title.confirmDeletePopup')}
				</h2>
				<button
					id="dismiss-delete-popup"
					type="button"
					className="text-lm-gray-900 dark:text-dm-gray-100 bg-transparent hover:bg-lm-gray-400 dark:hover:bg-dm-gray-600 transition-all rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center"
					onClick={onClose}
				>
					<svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
						<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
					</svg>
				</button>
			</div>
			<hr className="mb-2 border-t border-lm-gray-500 dark:border-dm-gray-500" />
			<p className="mb-2 mt-4 text-lm-gray-800 dark:text-dm-gray-200">{message}</p>
			<div className="flex justify-end space-x-2 pt-4">
				<Button
					id="close-delete-popup"
					onClick={onClose}
				>
					{t('common.cancel')}
				</Button>
				<Button
					id="confirm-delete-popup"
					variant="delete"
					onClick={onConfirm}
				>
					{t('common.delete')}
				</Button>
			</div>
		</PopupLayout>
	);
};

export default DeletePopup;
