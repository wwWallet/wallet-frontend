export const APP_VERSION = process.env.REACT_APP_VERSION;
export const BACKEND_URL = process.env.REACT_APP_WALLET_BACKEND_URL;
export const DID_KEY_VERSION = process.env.REACT_APP_DID_KEY_VERSION;
export const DISPLAY_CONSOLE = process.env.REACT_APP_DISPLAY_CONSOLE;
export const FIREBASE = {
	apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
	authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
	storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.REACT_APP_FIREBASE_APP_ID,
	measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};
export const FIREBASE_VAPIDKEY = process.env.REACT_APP_FIREBASE_VAPIDKEY;
export const LOGIN_WITH_PASSWORD: boolean = process.env.REACT_APP_LOGIN_WITH_PASSWORD === 'true';
export const WEBAUTHN_RPID = process.env.REACT_APP_WEBAUTHN_RPID ?? "localhost";
export const WS_URL = process.env.REACT_APP_WS_URL;
