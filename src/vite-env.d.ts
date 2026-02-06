/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_APP_TITLE: string;
	readonly VITE_WS_URL: string;
	readonly VITE_WALLET_BACKEND_URL: string;
	readonly VITE_LOGIN_WITH_PASSWORD: string;
	readonly VITE_DID_KEY_VERSION: string;
	readonly VITE_APP_VERSION: string;
	readonly VITE_GENERATE_SOURCEMAP: string;
	readonly VITE_DISPLAY_CONSOLE: string;
	readonly VITE_INACTIVE_LOGOUT_SECONDS: string;
	readonly VITE_WEBAUTHN_RPID: string;
	readonly VITE_OPENID4VCI_REDIRECT_URI: string;
	readonly VITE_OPENID4VP_SAN_DNS_CHECK: string;
	readonly VITE_OPENID4VP_SAN_DNS_CHECK_SSL_CERTS: string;
	readonly VITE_VALIDATE_CREDENTIALS_WITH_TRUST_ANCHORS: string;
	readonly VITE_MULTI_LANGUAGE_DISPLAY: string;
	readonly VITE_MULTI_LANGUAGE_DISPLAY: string;
	readonly VITE_CLOCK_TOLERANCE: string;
	readonly VITE_STATIC_PUBLIC_URL: string;
	readonly VITE_STATIC_NAME: string;
	readonly VITE_I18N_WALLET_NAME_OVERRIDE: string;
	readonly VITE_OPENID4VCI_PROOF_TYPE_PRECEDENCE: string;
	readonly VITE_FOLD_EVENT_HISTORY_AFTER_SECONDS: string;
	readonly VITE_DISPLAY_ISSUANCE_WARNINGS: string;
	readonly VITE_OPENID4VCI_MAX_ACCEPTED_BATCH_SIZE: string;
	readonly VITE_OPENID4VCI_TRANSACTION_ID_POLLING_INTERVAL_IN_SECONDS: string;
	readonly VITE_OPENID4VCI_TRANSACTION_ID_LIFETIME_IN_SECONDS: string;

	readonly BRANDING_LOGO_LIGHT: string;
	readonly BRANDING_LOGO_DARK: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
