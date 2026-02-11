export type DidKeyVersion = "p256-pub" | "jwk_jcs-pub";

function fromMeta(key: string): string | null {
	return document.head.querySelector(`meta[name="www:${key.toLocaleLowerCase()}"]`)?.getAttribute('content');
}

export const BACKEND_URL = fromMeta('wallet_backend_url');
export const DID_KEY_VERSION: DidKeyVersion = fromMeta('did_key_version') as DidKeyVersion;
export const DISPLAY_CONSOLE = fromMeta('display_console');
export const MULTI_LANGUAGE_DISPLAY: boolean = fromMeta('multi_language_display') ? JSON.parse(fromMeta('multi_language_display')) : false;
export const I18N_WALLET_NAME_OVERRIDE: string | undefined = fromMeta('i18n_wallet_name_override');
export const INACTIVE_LOGOUT_MILLIS = (fromMeta('inactive_logout_seconds') ? parseInt(fromMeta('inactive_logout_seconds'), 10) : 60 * 15) * 1000
export const LOGIN_WITH_PASSWORD: boolean = fromMeta('login_with_password') ? JSON.parse(fromMeta('login_with_password')) === true : false;
export const WEBAUTHN_RPID = fromMeta('webauthn_rpid') ?? "localhost";
export const WS_URL = fromMeta('ws_url');
export const OPENID4VP_SAN_DNS_CHECK = fromMeta('openid4vp_san_dns_check') ? fromMeta('openid4vp_san_dns_check') === 'true' : false;
export const OPENID4VP_SAN_DNS_CHECK_SSL_CERTS = fromMeta('openid4vp_san_dns_check_ssl_certs') ? fromMeta('openid4vp_san_dns_check_ssl_certs') === 'true' : false;
export const VALIDATE_CREDENTIALS_WITH_TRUST_ANCHORS = fromMeta('validate_credentials_with_trust_anchors') ? fromMeta('validate_credentials_with_trust_anchors')  === 'true' : false;
export const OPENID4VCI_REDIRECT_URI = fromMeta('openid4vci_redirect_uri') ?  fromMeta('openid4vci_redirect_uri') : "http://localhost:3000/";
export const CLOCK_TOLERANCE = fromMeta('clock_tolerance') && !isNaN(parseInt(fromMeta('clock_tolerance'))) ? parseInt(fromMeta('clock_tolerance')) : 60;
export const VITE_STATIC_PUBLIC_URL = fromMeta('static_public_url') || 'https://demo.wwwallet.org';
export const VITE_STATIC_NAME = fromMeta('static_name') || 'wwWallet';
export const OPENID4VCI_PROOF_TYPE_PRECEDENCE = fromMeta('openid4vci_proof_type_precedence') || 'jwt';
export const FOLD_EVENT_HISTORY_AFTER_SECONDS = fromMeta('fold_event_history_after_seconds') && !isNaN(parseInt(fromMeta('fold_event_history_after_seconds'))) ? parseInt(fromMeta('fold_event_history_after_seconds')) : 2592000; // 30 days
export const VITE_DISPLAY_ISSUANCE_WARNINGS: boolean = fromMeta('display_issuance_warnings') ? JSON.parse(fromMeta('display_issuance_warnings')) : false;
export const OPENID4VCI_MAX_ACCEPTED_BATCH_SIZE: number = fromMeta('openid4vci_max_accepted_batch_size') && !isNaN(parseInt(fromMeta('openid4vci_max_accepted_batch_size'))) ? parseInt(fromMeta('openid4vci_max_accepted_batch_size')) : 10;
export const OPENID4VCI_TRANSACTION_ID_POLLING_INTERVAL_IN_SECONDS = fromMeta('openid4vci_transaction_id_polling_interval_in_seconds') && !isNaN(parseInt(fromMeta('openid4vci_transaction_id_polling_interval_in_seconds'))) ? parseInt(fromMeta('openid4vci_transaction_id_polling_interval_in_seconds')) : 200;
export const OPENID4VCI_TRANSACTION_ID_LIFETIME_IN_SECONDS = fromMeta('openid4vci_transaction_id_lifetime_in_seconds') && !isNaN(parseInt(fromMeta('openid4vci_transaction_id_lifetime_in_seconds'))) ? parseInt(fromMeta('openid4vci_transaction_id_lifetime_in_seconds')) : 2592000;
export const OHTTP_KEY_CONFIG = fromMeta('ohttp_key_config');
export const OHTTP_RELAY = fromMeta('ohttp_relay');
export const VCT_REGISTRY_URL: string | undefined = fromMeta('vct_registry_url');

export const BRANDING = {
	LOGO_LIGHT: fromMeta('branding_logo_light') || '/logo_light.svg',
	LOGO_DARK: fromMeta('branding_logo_dark') || '/logo_dark.svg',
}

export const MODE = import.meta.env.MODE as 'development' | 'production' || 'production';
export const APP_VERSION = import.meta.env.VITE_APP_VERSION;
