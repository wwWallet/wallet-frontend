import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Buttons/Button';
import PopupLayout from './PopupLayout';
import { ExternalLink } from 'lucide-react';

const RedirectPopup = ({ loading, onClose, handleContinue, popupTitle, popupMessage }) => {
	const { t } = useTranslation();

	return (
		<PopupLayout isOpen={true} onClose={onClose} loading={loading}>
			<h2 className="text-lg font-bold mb-2 text-lm-gray-900 dark:text-dm-gray-100">
				<ExternalLink size={20} className="inline mr-1 mb-1" />
				{popupTitle}
			</h2>
			<hr className="mb-2 border-t border-lm-gray-400 dark:border-dm-gray-600" />
			<p className="mb-2 mt-4 text-lm-gray-900 dark:text-dm-gray-100">
				{popupMessage}
			</p>

			<div className="flex justify-end space-x-2 pt-4">
				<Button
					id="cancel-redirect-popup"
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
