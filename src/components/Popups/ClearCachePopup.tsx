import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Database } from 'lucide-react';

import Button from '../Buttons/Button';
import PopupLayout from './PopupLayout';

type ClearCachePopupProps = {
	isOpen: boolean,
	onClose: () => void,
	onConfirm: () => void,
	isClearing: boolean,
	isCleared: boolean,
};

const ClearCachePopup = ({
	isOpen,
	onClose,
	onConfirm,
	isClearing,
	isCleared,
}: ClearCachePopupProps) => {
	const { t } = useTranslation();
	const canDismiss = !isClearing && !isCleared;
	const Icon = isCleared ? CheckCircle : Database;

	const handleClose = () => {
		if (canDismiss) onClose();
	};

	return (
		<PopupLayout
			isOpen={isOpen}
			onClose={handleClose}
			shouldCloseOnOverlayClick={canDismiss}
		>
			<div role={isCleared ? 'status' : undefined}>
				<h2 className="text-lg font-bold mb-2 text-lm-gray-900 dark:text-dm-gray-100">
					<Icon size={20} className="inline mr-1 mb-1" />
					{t(isCleared ? 'pageSettings.clearCache.successMessage' : 'pageSettings.clearCache.confirmTitle')}
				</h2>
				<hr className="mb-2 border-t border-lm-gray-400 dark:border-dm-gray-600" />
				<p className="mb-2 mt-4 text-lm-gray-800 dark:text-dm-gray-200">
					{t(isCleared ? 'pageSettings.clearCache.reloadingMessage' : 'pageSettings.clearCache.confirmMessage')}
				</p>
				{!isCleared && (
					<div className="flex justify-end space-x-2 pt-4">
						<Button
							id="close-clear-cache-popup"
							onClick={handleClose}
							disabled={isClearing}
						>
							{t('common.cancel')}
						</Button>
						<Button
							id="confirm-clear-cache"
							variant="primary"
							onClick={onConfirm}
							disabled={isClearing}
						>
							{t(isClearing ? 'pageSettings.clearCache.clearing' : 'pageSettings.clearCache.buttonText')}
						</Button>
					</div>
				)}
			</div>
		</PopupLayout>
	);
};

export default ClearCachePopup;
