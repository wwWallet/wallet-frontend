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
				<h2 className="text-lg font-bold text-c-lm-red dark:text-c-dm-red">
					<Trash2 size={20} className="inline mr-1" />
					{t('pageSettings.title.confirmDeletePopup')}
				</h2>
				<button
					id="dismiss-delete-popup"
					type="button"
					className="text-c-lm-gray-900 dark:text-c-dm-gray-100 bg-transparent hover:bg-c-lm-gray-400 dark:hover:bg-c-dm-gray-600 transition-all rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center"
					onClick={onClose}
				>
					<svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
						<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
					</svg>
				</button>
			</div>
			<hr className="mb-2 border-t border-c-lm-red dark:border-c-dm-red" />
			<p className="mb-2 mt-4 text-c-lm-gray-800 dark:text-c-dm-gray-200">{message}</p>
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
