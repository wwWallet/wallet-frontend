import { type ClientMetaConfig } from '../config';
export type DidKeyVersion = "p256-pub" | "jwk_jcs-pub";

type Config = ClientMetaConfig & Record<string, string | undefined>;

const config: Config = {};

(function () {
	if (typeof window === 'undefined') {
		console.warn('Config injection is only supported in a browser environment.');
		return;
	}

	const metaTag = document.querySelector('meta[name="www:config"]');
	if (metaTag) {
		try {
			const content = metaTag.getAttribute('content');
			if (content) {
				Object.assign(config, JSON.parse(content));
			}
		} catch (error) {
			console.error('Failed to parse config from meta tag:', error);
		}
	}
})();
export const BASE_PATH = config.base_path || '/';
export const BACKEND_URL = config.wallet_backend_url;
export const DID_KEY_VERSION: DidKeyVersion = config.did_key_version as DidKeyVersion;
export const DISPLAY_CONSOLE = config.display_console;
export const MULTI_LANGUAGE_DISPLAY: boolean = config.multi_language_display ? JSON.parse(config.multi_language_display) : false;
export const I18N_WALLET_NAME_OVERRIDE: string | undefined = config.i18n_wallet_name_override;
export const INACTIVE_LOGOUT_MILLIS = (config.inactive_logout_seconds ? parseInt(config.inactive_logout_seconds, 10) : 60 * 15) * 1000
export const LOGIN_WITH_PASSWORD: boolean = config.login_with_password ? JSON.parse(config.login_with_password) === true : false;
export const WEBAUTHN_RPID = config.webauthn_rpid ?? "localhost";
export const WS_URL = config.ws_url;
export const OPENID4VP_SAN_DNS_CHECK = config.openid4vp_san_dns_check ? config.openid4vp_san_dns_check === 'true' : false;
export const OPENID4VP_SAN_DNS_CHECK_SSL_CERTS = config.openid4vp_san_dns_check_ssl_certs ? config.openid4vp_san_dns_check_ssl_certs === 'true' : false;
export const VALIDATE_CREDENTIALS_WITH_TRUST_ANCHORS = config.validate_credentials_with_trust_anchors ? config.validate_credentials_with_trust_anchors  === 'true' : false;
export const OPENID4VCI_REDIRECT_URI = config.openid4vci_redirect_uri ?  config.openid4vci_redirect_uri : "http://localhost:3000/";
export const CLOCK_TOLERANCE = config.clock_tolerance && !isNaN(parseInt(config.clock_tolerance)) ? parseInt(config.clock_tolerance) : 60;
export const STATIC_PUBLIC_URL = config.static_public_url || 'https://demo.wwwallet.org';
export const STATIC_NAME = config.static_name || 'wwWallet';
export const OPENID4VCI_PROOF_TYPE_PRECEDENCE = config.openid4vci_proof_type_precedence || 'jwt';
export const FOLD_EVENT_HISTORY_AFTER_SECONDS = config.fold_event_history_after_seconds && !isNaN(parseInt(config.fold_event_history_after_seconds)) ? parseInt(config.fold_event_history_after_seconds) : 2592000; // 30 days
export const DISPLAY_ISSUANCE_WARNINGS: boolean = config.display_issuance_warnings ? JSON.parse(config.display_issuance_warnings) : false;
export const OPENID4VCI_MAX_ACCEPTED_BATCH_SIZE: number = config.openid4vci_max_accepted_batch_size && !isNaN(parseInt(config.openid4vci_max_accepted_batch_size)) ? parseInt(config.openid4vci_max_accepted_batch_size) : 10;
export const OPENID4VCI_TRANSACTION_ID_POLLING_INTERVAL_IN_SECONDS = config.openid4vci_transaction_id_polling_interval_in_seconds && !isNaN(parseInt(config.openid4vci_transaction_id_polling_interval_in_seconds)) ? parseInt(config.openid4vci_transaction_id_polling_interval_in_seconds) : 200;
export const OPENID4VCI_TRANSACTION_ID_LIFETIME_IN_SECONDS = config.openid4vci_transaction_id_lifetime_in_seconds && !isNaN(parseInt(config.openid4vci_transaction_id_lifetime_in_seconds)) ? parseInt(config.openid4vci_transaction_id_lifetime_in_seconds) : 2592000;
export const OHTTP_KEY_CONFIG = config.ohttp_key_config;
export const OHTTP_RELAY = config.ohttp_relay;
export const VCT_REGISTRY_URL: string | undefined = config.vct_registry_url;
export const BRANDING = {
	LOGO_LIGHT: config.branding?.logo_light || '/logo_light.svg',
	LOGO_DARK: config.branding?.logo_dark || '/logo_dark.svg',
}

export const MODE = import.meta.env.MODE as 'development' | 'production' || 'production';
export const APP_VERSION = import.meta.env.APP_VERSION;
