import React, { useState, useEffect, useContext } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { onMessageListener } from '../firebase';
import { AiOutlineClose } from 'react-icons/ai';
import logo from '../assets/images/logo.png';
import CredentialsContext from '../context/CredentialsContext';

const ToastDisplay = ({ id, notification }) => {
	return (
		<div
			className="flex justify-between items-center p-3 bg-white rounded-lg text-gray-600 max-w-3xl mx-auto cursor-pointer"
			onClick={() => window.location.href = '/'}
		>
			<div className="w-1/3 flex items-center justify-start mr-6">
				<img src={logo} alt="Logo" className="" />
			</div>
			<div className="flex-grow text-center">
				<p className="font-bold text-lg">{notification?.title}</p>
				<p>{notification?.body}</p>
			</div>
			<button onClick={(e) => {
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

const HandlerNotification = ({ children }) => {
	const [notification, setNotification] = useState({ title: '', body: '' });
	const { refreshCredentials } = useContext(CredentialsContext);

	const showToast = () =>
		toast((t) => <ToastDisplay id={t.id} notification={notification} />);

	useEffect(() => {
		if (notification?.title) {
			showToast();
		}
	}, [notification]);

	useEffect(() => {
		const messageListener = onMessageListener()
			.then((payload) => {
				setNotification({
					title: payload?.notification?.title,
					body: payload?.notification?.body,
				});
				refreshCredentials();
			})
			.catch((err) => {
				console.log('Failed to receive message:', err);
			});

		return () => {
			if (messageListener && typeof messageListener === 'function') {
				messageListener();
			}
		};
	}, [refreshCredentials]);

	return (
		<div>
			<Toaster />
			{children}
		</div>
	);
};

export default HandlerNotification;
