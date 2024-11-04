/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_APP_TITLE: string;
	readonly VITE_WS_URL: string;
	readonly VITE_WALLET_BACKEND_URL: string;
	readonly VITE_LOGIN_WITH_PASSWORD: string;
	readonly VITE_FIREBASE_ENABLED: string;
	readonly VITE_FIREBASE_VAPIDKEY: string;
	readonly VITE_FIREBASE_API_KEY: string;
	readonly VITE_FIREBASE_AUTH_DOMAIN: string;
	readonly VITE_FIREBASE_PROJECT_ID: string;
	readonly VITE_FIREBASE_STORAGE_BUCKET: string;
	readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
	readonly VITE_FIREBASE_APP_ID: string;
	readonly VITE_FIREBASE_MEASUREMENT_ID: string;
	readonly VITE_DID_KEY_VERSION: string;
	readonly VITE_APP_VERSION: string;
	readonly VITE_DISPLAY_CONSOLE: string;
	readonly VITE_WEBAUTHN_RPID: string;
	readonly VITE_OPENID4VCI_REDIRECT_URI: string;
	readonly VITE_OPENID4VP_SAN_DNS_CHECK: string;
	readonly VITE_OPENID4VP_SAN_DNS_CHECK_SSL_CERTS: string;
	readonly VITE_VALIDATE_CREDENTIALS_WITH_TRUST_ANCHORS: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
