import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

let firebase = null;
let messaging = null;
let supported = false;

const initializeFirebase = async () => {
    supported = await isSupported();
    if (supported) {
        firebase = initializeApp(firebaseConfig);
        messaging = getMessaging();
    }
    console.log("Supported", supported);

};


const requestForToken = async () => {
	if (!supported) {
			return null;
	}
	if (messaging) {
			try {
					const currentToken = await getToken(messaging, { vapidKey: process.env.REACT_APP_FIREBASE_VAPIDKEY });
					if (currentToken) {
							console.log('Current token for client:', currentToken);
							return currentToken;
					} else {
							console.log('No registration token available. Request permission to generate one.');
							return null;
					}
			} catch (err) {
					console.log('ERROR:',err.message,err.code);
					if (err.code === 'messaging/permission-blocked') {
							console.error('Notification permission was blocked or click close.');
							return null;
					}else if (err.message === "Failed to execute 'subscribe' on 'PushManager': Subscription failed - no active Service Worker") {
								console.error('Failed beacuse there is no token created yet, so we are going to re-register');

					} else {
							console.error('An error occurred while retrieving token:',err);
							return null;
					}
			}
	} else {
			console.log('Messaging is not initialized.');
			return null;
	}
};


const reRegisterServiceWorkerAndGetToken = async () => {
    if ('serviceWorker' in navigator) {
        try {
            // Re-register the service worker
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
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
	if (messaging) {
			const token = await requestForToken();
			console.log('token:',token);
			if (token || token ===null) {
					return token;
			} else {
					console.log('Failed to retrieve token. Trying to re-register service worker.');
					const newToken =await reRegisterServiceWorkerAndGetToken(); // Re-register service worker and fetch token
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
    new Promise((resolve) => {
        if (supported) {
            onMessage(messaging, (payload) => {
                resolve(payload);
            });
        }
});

const initializeMessaging = async () => {
    // Check for service worker
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
            if (registration) {
                console.log('Service Worker registered', registration);
                return getMessaging();
            } else {
                console.log('Service Worker registration failed');
            }
        } catch (error) {
            console.error('Service Worker registration failed with', error);
        }
    } else {
        console.log('Service Workers are not supported in this browser.');
    }
};

const initializeFirebaseAndMessaging = async () => {
	await initializeFirebase();
	const messaging = await initializeMessaging();
	// Now you can use the messaging object if it's available
	if (messaging) {
			// Do something with the messaging object
	} else {
			console.log('Messaging is not initialized.');
	}
};

initializeFirebaseAndMessaging();
