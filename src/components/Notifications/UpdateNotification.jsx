import React, { useContext, useState } from 'react';
import StatusContext from '@/context/StatusContext';
import { useTranslation } from 'react-i18next';
import Button from '../Buttons/Button';
import { FaTimes } from 'react-icons/fa';
import { MdNotifications } from "react-icons/md";

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
		<div className="fixed right-4 bottom-4 sm:top-4 sm:bottom-auto bg-c-lm-green dark:bg-c-dm-green z-50 text-white dark:text-c-lm-gray-900 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 space-x-2 animate-slide-in-up sm:animate-slide-in-down">
			<MdNotifications
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
				className="ml-2 text-inherit p-2 rounded hover:bg-c-dm-green-bg dark:hover:bg-c-lm-green-bg"
				onClick={handleClose}
			>
				<FaTimes />
			</button>
		</div>
	);
};

export default UpdateNotification;
