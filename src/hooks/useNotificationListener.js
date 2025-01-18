import { useEffect, useState, useContext } from 'react';
import { onMessageListener } from '../firebase';
import CredentialsContext from '../context/CredentialsContext';

const useNotificationListener = () => {
	const [notification, setNotification] = useState(null);
	const { getData } = useContext(CredentialsContext);

	useEffect(() => {
		const listenForNotifications = () => {
			onMessageListener()
				.then((payload) => {
					setNotification({
						title: payload?.notification?.title,
						body: payload?.notification?.body,
					})
					getData();
				})
				.catch((err) => {
					console.error('Failed to receive notification:', err);
				});
		};

		listenForNotifications();
	}, [getData]);

	return notification;
};

export default useNotificationListener;
