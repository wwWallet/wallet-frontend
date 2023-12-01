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

    // Check for notification permission and register token if granted
    if (supported) {
        const permission = Notification.permission;
        if (permission === "granted") {
            registerToken();
        } else if (permission !== "denied") {
            // User hasn't made a decision yet, listen for permission change
            Notification.requestPermission().then((result) => {
                if (result === "granted") {
                    registerToken();
                }
            });
        }
    }
};

const registerToken = async () => {
    const token = await requestForToken();
    if (token) {
        // Store the token or perform any other necessary actions
        console.log('Token registered and stored:', token);
    } else {
        console.log('Failed to retrieve token.');
    }
};

const requestForToken = async () => {
    if (!supported) {
        return undefined;
    }
    if (messaging) {
        try {
            const currentToken = await getToken(messaging, { vapidKey: process.env.REACT_APP_FIREBASE_VAPIDKEY });
            if (currentToken) {
                console.log('Current token for client:', currentToken);
                return currentToken;
            } else {
                console.log('No registration token available. Request permission to generate one.');
                await reRegisterServiceWorkerAndGetToken();
            }
        } catch (err) {
            console.error('An error occurred while retrieving token:', err);
            await reRegisterServiceWorkerAndGetToken();
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
                // Initialize Firebase Messaging
                const messaging = getMessaging();
                // Request a new FCM token
                const token = await requestForToken();
                if (token) {
                    console.log('New FCM token obtained:', token);
                } else {
                    console.log('Failed to retrieve a new token.');
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
        if (token) {
            return token;
        } else {
            console.log('Failed to retrieve token. Trying to re-register service worker.');
            await reRegisterServiceWorkerAndGetToken(); // Re-register service worker and fetch token
            const newToken = await requestForToken();
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

initializeFirebase();