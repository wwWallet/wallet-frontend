import React, { useState, useEffect } from 'react';
import { FaShare } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import Button from '../Buttons/Button';
import PopupLayout from './PopupLayout';

const RedirectPopup = ({ loading, onClose, handleContinue, popupTitle, popupMessage }) => {
	const { t } = useTranslation();

	return (
		<PopupLayout isOpen={true} onClose={onClose} loading={loading}>
			<h2 className="text-lg font-bold mb-2 text-primary dark:text-white">
				<FaShare size={20} className="inline mr-1 mb-1" />
				{popupTitle}
			</h2>
			<hr className="mb-2 border-t border-primary/80 dark:border-white/80" />
			<p className="mb-2 mt-4 text-gray-700 dark:text-white">
				{popupMessage}
			</p>

			<div className="flex justify-end space-x-2 pt-4">
				<Button
					id="cancel-redirect-popup"
					variant="cancel"
					onClick={onClose}
				>
					{t('common.cancel')}
				</Button>
				<Button
					id="continue-redirect-popup"
					variant="primary"
					onClick={() => handleContinue()}
				>
					{t('common.continue')}
				</Button>
			</div>
		</PopupLayout>
	);
};

export default RedirectPopup;
