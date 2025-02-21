export type DidKeyVersion = "p256-pub" | "jwk_jcs-pub";

export const APP_VERSION = process.env.REACT_APP_VERSION;
export const BACKEND_URL = process.env.REACT_APP_WALLET_BACKEND_URL;
export const DID_KEY_VERSION: DidKeyVersion = process.env.REACT_APP_DID_KEY_VERSION as DidKeyVersion;
export const DISPLAY_CONSOLE = process.env.REACT_APP_DISPLAY_CONSOLE;
export const FIREBASE = {
	apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
	appId: process.env.REACT_APP_FIREBASE_APP_ID,
	authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
	measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
	messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
	projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
	storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
};
export const FIREBASE_ENABLED: boolean = process.env.REACT_APP_FIREBASE_ENABLED ? JSON.parse(process.env.REACT_APP_FIREBASE_ENABLED) === true : false;
export const REACT_APP_MULTI_LANGUAGE_DISPLAY: boolean = process.env.REACT_APP_MULTI_LANGUAGE_DISPLAY ? JSON.parse(process.env.REACT_APP_MULTI_LANGUAGE_DISPLAY) : false;
export const FIREBASE_VAPIDKEY = process.env.REACT_APP_FIREBASE_VAPIDKEY;
export const INACTIVE_LOGOUT_MILLIS = (process.env.REACT_APP_INACTIVE_LOGOUT_SECONDS ? parseInt(process.env.REACT_APP_INACTIVE_LOGOUT_SECONDS, 10) : 60 * 15) * 1000
export const LOGIN_WITH_PASSWORD: boolean = process.env.REACT_APP_LOGIN_WITH_PASSWORD ? JSON.parse(process.env.REACT_APP_LOGIN_WITH_PASSWORD) === true : false;
export const WEBAUTHN_RPID = process.env.REACT_APP_WEBAUTHN_RPID ?? "localhost";
export const WS_URL = process.env.REACT_APP_WS_URL;
export const OPENID4VP_SAN_DNS_CHECK = process.env.REACT_APP_OPENID4VP_SAN_DNS_CHECK ? process.env.REACT_APP_OPENID4VP_SAN_DNS_CHECK === 'true' : false;
export const OPENID4VP_SAN_DNS_CHECK_SSL_CERTS = process.env.REACT_APP_OPENID4VP_SAN_DNS_CHECK_SSL_CERTS ? process.env.REACT_APP_OPENID4VP_SAN_DNS_CHECK_SSL_CERTS === 'true' : false;
export const VALIDATE_CREDENTIALS_WITH_TRUST_ANCHORS = process.env.VALIDATE_CREDENTIALS_WITH_TRUST_ANCHORS ? process.env.VALIDATE_CREDENTIALS_WITH_TRUST_ANCHORS : false;
export const OPENID4VCI_REDIRECT_URI = process.env.REACT_APP_OPENID4VCI_REDIRECT_URI ?  process.env.REACT_APP_OPENID4VCI_REDIRECT_URI : "http://localhost:3000/";
export const CLOCK_TOLERANCE = process.env.REACT_APP_CLOCK_TOLERANCE && !isNaN(parseInt(process.env.REACT_APP_CLOCK_TOLERANCE)) ? parseInt(process.env.REACT_APP_CLOCK_TOLERANCE) : 60;
