import { useEffect, useState, useContext, useRef } from 'react';
import { onMessageListener } from '../firebase';
import CredentialsContext from '../context/CredentialsContext';

const useNewCredentialListener = () => {
	const [notification, setNotification] = useState(null);
	const { getData } = useContext(CredentialsContext);

	// Use a ref to store getData to prevent triggering useEffect when it changes
	const getDataRef = useRef(getData);

	useEffect(() => {
		getDataRef.current = getData; // Keep the ref updated with the latest getData function
	}, [getData]);

	useEffect(() => {
		const listenForNotification = (payload) => {
			console.log('Notification received:', payload);
			setNotification({
				title: payload?.notification?.title,
				body: payload?.notification?.body,
			});
			getDataRef.current();
		};

		onMessageListener(listenForNotification);

		// Optional cleanup function for consistency and future-proofing
		return () => {
			// Firebase's `onMessage` does not require unsubscription
			// Add cleanup logic here if needed in the future
		};

	}, []);

	return notification;
};

export default useNewCredentialListener;
