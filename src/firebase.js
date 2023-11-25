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
    firebase = (await isSupported()) ? initializeApp(firebaseConfig) : null;
    if (firebase != null)
        supported = true;
    console.log("Supported", supported);
    if (supported) {
        messaging = getMessaging();
    }
    console.log("initialized firebase");

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
    const token = await requestForToken(messaging);
    if (token) {
        // Store the token or perform any other necessary actions
        console.log('Token registered and stored:', token);
    } else {
        console.log('Failed to retrieve token.');
    }
};

const initializeMessaging = async () => {
    // Check for service worker
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
            if (registration) {
                console.log('Service Worker registered', registration);
                // Initialize Messaging
                const messaging = getMessaging();
                // Assign messaging to a variable that can be accessed outside this function if needed
                return messaging;
            } else {
                console.log('Service Worker registration failed');
                return null;
            }
        } catch (error) {
            console.log('Service Worker registration failed with ', error);
            return null;
        }
    } else {
        console.log('Service Workers are not supported in this browser.');
        return null;
    }
};

const requestForToken = async (messaging) => {
    if (!supported) {
        return undefined;
    }
    if (messaging) {
        try {
            const currentToken = await getToken(messaging, { vapidKey: process.env.VAPIDKEY });
            if (currentToken) {
                console.log('Current token for client: ', currentToken);
                return currentToken;
            } else {
                console.log('No registration token available. Request permission to generate one.');
                return null;
            }
        } catch (err) {
            console.log('An error occurred while retrieving token. ', err);
            return null;
        }
    } else {
        console.log('Messaging is not initialized.');
        return null;
    }
};

export const fetchToken = async () => {
    const messaging = await initializeMessaging();
    const token = await requestForToken(messaging);
    if (token) {
        return token;
    } else {
        console.log('Failed to retrieve token.');
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        if (supported) {
            onMessage(messaging, (payload) => {
                resolve(payload);
            });
        }
    });

initializeFirebase();