import { MODE } from './config';

const basePath = (() => {
	// TODO: set a different base path depending on tenants, e.g. /id/tenant1/, /id/tenant2/, etc.
	// For now, just return '/'.
	return '/'
})();

const swScope = basePath.replace(/\/?$/, '/');
const swPath = `${swScope}service-worker.js`;

const tt = window.trustedTypes || window.TrustedTypes;

const swPolicy = tt
	? tt.createPolicy('sw-register', {
		createScriptURL(url) {
			if (url === swPath) {
				return url;
			}
			throw new TypeError('Untrusted service worker URL blocked by Trusted Types policy');
		}
	})
	: null;

if (MODE === 'production' && 'serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		const trustedSwUrl = swPolicy ? swPolicy.createScriptURL(swPath) : swPath;
		navigator.serviceWorker
			.register(trustedSwUrl, { scope: swScope })
			.catch(err => {
				console.error('Service worker registration failed:', err);
			});
	});
}
