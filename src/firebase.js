import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

import * as config from './config';


let messaging = null;

export const notificationApiIsSupported = () =>
	'Notification' in window &&
	'serviceWorker' in navigator &&
	'PushManager' in window

export async function register() {
	if (await isSupported() && 'serviceWorker' in navigator) {
		try {
			const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/notifications/' });
			console.log('App: Firebase Messaging Service Worker registered! Scope is:', registration.scope);
		} catch (err) {
			console.log('App: Firebase Messaging Service Worker registration failed:', err);
		}
	} else {
		console.log('Service Workers are not supported in this browser.');
	}
};

const requestForToken = async () => {
	if (!await isSupported()) {
		return null;
	}
	if (messaging) {
		try {
			const currentToken = await getToken(messaging, { vapidKey: config.FIREBASE_VAPIDKEY });
			if (currentToken) {
				console.log('Current token for client:', currentToken);
				return currentToken;
			} else {
				console.log('No registration token available. Request permission to generate one.');
				return null;
			}
		} catch (err) {
			console.log('ERROR:', err.message, err.code);
			if (err.code === 'messaging/permission-blocked') {
				console.error('Notification permission was blocked or click close.');
				return null;
			} else if (err.message === "Failed to execute 'subscribe' on 'PushManager': Subscription failed - no active Service Worker") {
				console.error('Failed beacuse there is no token created yet, so we are going to re-register');

			} else {
				console.error('An error occurred while retrieving token:', err);
				return null;
			}
		}
	} else {
		console.log('Messaging is not initialized.');
		return null;
	}
};


const reRegisterServiceWorkerAndGetToken = async () => {
	if (!await isSupported()) {
		return null;
	}
	if ('serviceWorker' in navigator) {
		try {
			// Re-register the service worker
			const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/notifications/' });
			if (registration) {
				console.log('Service Worker re-registered', registration);
				const token = await requestForToken();
				if (token) {
					console.log('New FCM token obtained:', token);
					return token;
				} else {
					console.log('Failed to retrieve a new token.');
					return null;
				}
			} else {
				console.log('Service Worker re-registration failed');
			}
		} catch (error) {
			console.error('Service Worker re-registration failed with', error);
		}
	} else {
		console.log('Service Workers are not supported in this browser.');
	}
};

export const fetchToken = async () => {
	if (await isSupported() && messaging) {
		const token = await requestForToken();
		console.log('token:', token);
		if (token) {
			return token;
		} else {
			console.log('Failed to retrieve token. Trying to re-register service worker.');
			const newToken = await reRegisterServiceWorkerAndGetToken(); // Re-register service worker and fetch token
			if (newToken) {
				return newToken;
			} else {
				console.log('Failed to retrieve a new token after re-registration.');
			}
		}
	} else {
		console.log('Messaging is not initialized.');
	}
	return null; // Return null in case of failure
};


export const onMessageListener = () =>
	new Promise(async (resolve) => {
		if (await isSupported()) {
			onMessage(messaging, (payload) => {
				resolve(payload);
			});
		}
	});


const initializeFirebaseAndMessaging = async () => {
	if (notificationApiIsSupported()) {
		let supported = await isSupported();
		console.log("Supported", supported);
		if (supported) {
			initializeApp(config.FIREBASE);
			messaging = getMessaging();
			if (messaging) {
				console.log('Messaging is initialized.');
			} else {
				console.log('Messaging is not initialized.');
			}
		}
	}
};

initializeFirebaseAndMessaging();
