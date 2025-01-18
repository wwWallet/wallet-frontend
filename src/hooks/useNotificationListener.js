import { useEffect, useState, useContext, useRef } from 'react';
import { onMessageListener } from '../firebase';
import CredentialsContext from '../context/CredentialsContext';

const useNotificationListener = () => {
	const [notification, setNotification] = useState(null);
	const { getData } = useContext(CredentialsContext);

	// Use a ref to store getData to prevent triggering useEffect when it changes
	const getDataRef = useRef(getData);

	useEffect(() => {
		getDataRef.current = getData; // Keep the ref updated with the latest getData function
	}, [getData]);

	useEffect(() => {
		const listenForNotifications = () => {
			onMessageListener()
				.then((payload) => {
					setNotification({
						title: payload?.notification?.title,
						body: payload?.notification?.body,
					})
					getDataRef.current();
				})
				.catch((err) => {
					console.error('Failed to receive notification:', err);
				});
		};
		listenForNotifications();
	}, []);

	return notification;
};

export default useNotificationListener;
