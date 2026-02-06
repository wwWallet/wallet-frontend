import React, { useContext, useState } from 'react';
import StatusContext from '@/context/StatusContext';
import { useTranslation } from 'react-i18next';
import Button from '../Buttons/Button';
import { Bell, X } from 'lucide-react';

const UpdateNotification = () => {
	const { updateAvailable } = useContext(StatusContext);
	const [visible, setVisible] = useState(updateAvailable);
	const { t } = useTranslation();

	const handleReload = () => {
		window.location.reload();
	};

	const handleClose = () => {
		setVisible(false);
	};

	if (!visible) return null;

	return (
		<div className="fixed right-4 bottom-4 sm:top-4 sm:bottom-auto bg-lm-green dark:bg-dm-green z-50 text-white dark:text-lm-gray-900 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 space-x-2 animate-slide-in-up sm:animate-slide-in-down">
			<Bell
				size={22}
				className="text-inherit"
			/>
			{t('updateNotification.description')}
			<Button
				id="reload-update-notification"
				variant="outline"
				onClick={handleReload}
			>
				{t('common.refresh')}
			</Button>
			<button
				id="close-update-notification"
				className="ml-2 text-inherit p-2 rounded hover:bg-dm-green-bg dark:hover:bg-lm-green-bg"
				onClick={handleClose}
			>
				<X />
			</button>
		</div>
	);
};

export default UpdateNotification;
