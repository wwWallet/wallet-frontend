export type HTMLMetaTags = Array<{
	name: string;
	content: string;
}>

export function generateHtmlMetaTags(env: Record<string, string>): HTMLMetaTags {
	const runtimeVars = [
		'VITE_BACKEND_URL',
		'VITE_DID_KEY_VERSION',
		'VITE_DISPLAY_CONSOLE',
		'VITE_MULTI_LANGUAGE_DISPLAY',
		'VITE_I18N_WALLET_NAME_OVERRIDE',
		'VITE_INACTIVE_LOGOUT_MILLIS',
		'VITE_LOGIN_WITH_PASSWORD',
		'VITE_WEBAUTHN_RPID',
		'VITE_WS_URL',
		'VITE_OPENID4VP_SAN_DNS_CHECK',
		'VITE_OPENID4VP_SAN_DNS_CHECK_SSL_CERTS',
		'VITE_VALIDATE_CREDENTIALS_WITH_TRUST_ANCHORS',
		'VITE_OPENID4VCI_REDIRECT_URI',
		'VITE_CLOCK_TOLERANCE',
		'VITE_STATIC_PUBLIC_URL',
		'VITE_STATIC_NAME',
		'VITE_OPENID4VCI_PROOF_TYPE_PRECEDENCE',
		'VITE_FOLD_EVENT_HISTORY_AFTER_SECONDS',
		'VITE_DISPLAY_ISSUANCE_WARNINGS',
		'VITE_OPENID4VCI_MAX_ACCEPTED_BATCH_SIZE',
		'VITE_OPENID4VCI_TRANSACTION_ID_POLLING_INTERVAL_IN_SECONDS',
		'VITE_OPENID4VCI_TRANSACTION_ID_LIFETIME_IN_SECONDS',
		'VITE_OHTTP_KEY_CONFIG',
		'VITE_OHTTP_RELAY',
		'VITE_VCT_REGISTRY_URL',
	];

	const tags: HTMLMetaTags = [];

	for (const varName of runtimeVars) {
		if (env[varName] !== undefined) {
			tags.push({
				name: `www:${varName.toLocaleLowerCase().replace(/^vite_/, '')}`,
				content: env[varName] as string,
			});
		}
	}

	return tags;
}
