import { useEffect, useState, useContext, useRef } from 'react';
import { onMessageListener } from '../firebase';
import CredentialsContext from '../context/CredentialsContext';

const useNewCredentialListener = () => {
	const [notification, setNotification] = useState(() => {
		// Retrieve notification from sessionStorage on initial load
		const savedNotification = sessionStorage.getItem('newCredentialNotification');
		return savedNotification ? JSON.parse(savedNotification) : null;
	});

	const { getData } = useContext(CredentialsContext);

	// Use a ref to store getData to prevent triggering useEffect when it changes
	const getDataRef = useRef(getData);

	useEffect(() => {
		getDataRef.current = getData; // Keep the ref updated with the latest getData function
	}, [getData]);

	useEffect(() => {
		const listenForNotification = (payload) => {
			console.log('Notification received:', payload);

			const newNotification = {
				title: payload?.notification?.title,
				body: payload?.notification?.body,
			};
			// Save notification to sessionStorage
			sessionStorage.setItem('newCredentialNotification', JSON.stringify(newNotification));

			// Update the state
			setNotification(newNotification);

			getDataRef.current();
		};

		onMessageListener(listenForNotification);

		// Optional cleanup function for consistency and future-proofing
		return () => {
			// Firebase's `onMessage` does not require unsubscription
			// Add cleanup logic here if needed in the future
		};

	}, []);

	const clearNotification = () => {
		setNotification(null);
		sessionStorage.removeItem('newCredentialNotification'); // Clear from sessionStorage
	};

	return { notification, clearNotification };
};

export default useNewCredentialListener;
