import React, { useEffect, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { AiOutlineClose } from 'react-icons/ai';
import Logo from '../Logo/Logo';
import { useLocation } from "react-router-dom";

const ToastDisplay = ({ id, notification }) => {
	return (
		<div
			className="flex justify-between items-center p-3 bg-white rounded-lg text-gray-600 max-w-3xl mx-auto cursor-pointer"
			onClick={() => window.location.href = '/'}
		>
			<div className="w-1/3 flex items-center justify-start mr-6">
				<Logo />
			</div>
			<div className="flex-grow text-center">
				<p className="font-bold text-lg">{notification?.title}</p>
				<p>{notification?.body}</p>
			</div>
			<button
				id="new-credential-notification-dismiss"
				onClick={(e) => {
					toast.dismiss(id);
					e.stopPropagation();
				}}
				className="focus:outline-none ml-6"
			>
				<AiOutlineClose size={24} />
			</button>
		</div>
	);
};

const NewCredentialNotification = ({ notification, clearNotification }) => {
	const location = useLocation();
	const showToast = useCallback(() => {
		toast((t) => <ToastDisplay id={t.id} notification={notification} />);
		clearNotification();
	}, [notification, clearNotification]);

	useEffect(() => {
		if (notification && window.location.pathname === '/') {
			showToast();
		}
	}, [notification, location, showToast]);

	return (
		<Toaster />
	);
};

export default NewCredentialNotification;
