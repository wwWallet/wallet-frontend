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
		<div className="fixed right-4 bottom-4 sm:top-4 sm:bottom-auto bg-green-600 bg-opacity-80 z-50 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in-up sm:animate-slide-in-down">
			<MdNotifications
				size={22}
				className="text-white"
			/>
			{t('updateNotification.description')}
			<Button
				variant="tertiary"
				onClick={handleReload}
			>
				{t('common.refresh')}
			</Button>
			<button
				className="ml-2 text-white hover:text-gray-300"
				onClick={handleClose}
			>
				<FaTimes />
			</button>
		</div>
	);
};

export default UpdateNotification;
