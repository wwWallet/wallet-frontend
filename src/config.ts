export type DidKeyVersion = "p256-pub" | "jwk_jcs-pub";

export const APP_VERSION = import.meta.env.VITE_APP_VERSION;
export const BACKEND_URL = import.meta.env.VITE_WALLET_BACKEND_URL;
export const DID_KEY_VERSION: DidKeyVersion = import.meta.env.VITE_DID_KEY_VERSION as DidKeyVersion;
export const DISPLAY_CONSOLE = import.meta.env.VITE_DISPLAY_CONSOLE;
export const FIREBASE = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
};
export const FIREBASE_ENABLED: boolean = import.meta.env.VITE_FIREBASE_ENABLED ? JSON.parse(import.meta.env.VITE_FIREBASE_ENABLED) === true : false;
export const MULTI_LANGUAGE_DISPLAY: boolean = import.meta.env.VITE_MULTI_LANGUAGE_DISPLAY ? JSON.parse(import.meta.env.VITE_MULTI_LANGUAGE_DISPLAY) : false;
export const I18N_WALLET_NAME_OVERRIDE: string | undefined = import.meta.env.VITE_I18N_WALLET_NAME_OVERRIDE;
export const FIREBASE_VAPIDKEY = import.meta.env.VITE_FIREBASE_VAPIDKEY;
export const INACTIVE_LOGOUT_MILLIS = (import.meta.env.VITE_INACTIVE_LOGOUT_SECONDS ? parseInt(import.meta.env.VITE_INACTIVE_LOGOUT_SECONDS, 10) : 60 * 15) * 1000
export const LOGIN_WITH_PASSWORD: boolean = import.meta.env.VITE_LOGIN_WITH_PASSWORD ? JSON.parse(import.meta.env.VITE_LOGIN_WITH_PASSWORD) === true : false;
export const WEBAUTHN_RPID = import.meta.env.VITE_WEBAUTHN_RPID ?? "localhost";
export const WS_URL = import.meta.env.VITE_WS_URL;
export const OPENID4VP_SAN_DNS_CHECK = import.meta.env.VITE_OPENID4VP_SAN_DNS_CHECK ? import.meta.env.VITE_OPENID4VP_SAN_DNS_CHECK === 'true' : false;
export const OPENID4VP_SAN_DNS_CHECK_SSL_CERTS = import.meta.env.VITE_OPENID4VP_SAN_DNS_CHECK_SSL_CERTS ? import.meta.env.VITE_OPENID4VP_SAN_DNS_CHECK_SSL_CERTS === 'true' : false;
export const VALIDATE_CREDENTIALS_WITH_TRUST_ANCHORS = import.meta.env.VITE_VALIDATE_CREDENTIALS_WITH_TRUST_ANCHORS ? import.meta.env.VITE_VALIDATE_CREDENTIALS_WITH_TRUST_ANCHORS  === 'true' : false;
export const OPENID4VCI_REDIRECT_URI = import.meta.env.VITE_OPENID4VCI_REDIRECT_URI ?  import.meta.env.VITE_OPENID4VCI_REDIRECT_URI : "http://localhost:3000/";
export const CLOCK_TOLERANCE = import.meta.env.VITE_CLOCK_TOLERANCE && !isNaN(parseInt(import.meta.env.VITE_CLOCK_TOLERANCE)) ? parseInt(import.meta.env.VITE_CLOCK_TOLERANCE) : 60;
export const VITE_STATIC_PUBLIC_URL = import.meta.env.VITE_STATIC_PUBLIC_URL || 'https://demo.wwwallet.org';
export const VITE_STATIC_NAME = import.meta.env.VITE_STATIC_NAME || 'wwWallet';
export const OPENID4VCI_PROOF_TYPE_PRECEDENCE = import.meta.env.VITE_OPENID4VCI_PROOF_TYPE_PRECEDENCE || 'jwt';
export const FOLD_EVENT_HISTORY_AFTER = import.meta.env.VITE_FOLD_EVENT_HISTORY_AFTER && !isNaN(parseInt(import.meta.env.VITE_FOLD_EVENT_HISTORY_AFTER)) ? parseInt(import.meta.env.VITE_FOLD_EVENT_HISTORY_AFTER) : 2592000; // 30-days in seconds
export const VITE_DISPLAY_ISSUANCE_WARNINGS: boolean = import.meta.env.VITE_DISPLAY_ISSUANCE_WARNINGS ? JSON.parse(import.meta.env.VITE_DISPLAY_ISSUANCE_WARNINGS) : false;
export const OPENID4VCI_MAX_ACCEPTED_BATCH_SIZE: number = import.meta.env.VITE_OPENID4VCI_MAX_ACCEPTED_BATCH_SIZE && !isNaN(parseInt(import.meta.env.VITE_OPENID4VCI_MAX_ACCEPTED_BATCH_SIZE)) ? parseInt(import.meta.env.VITE_OPENID4VCI_MAX_ACCEPTED_BATCH_SIZE) : 10;
