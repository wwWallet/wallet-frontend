import { MODE } from './config';

const basePath = (() => {
	// TODO: set a different base path depending on tenants, e.g. /id/tenant1/, /id/tenant2/, etc.
	// For now, just return '/'.
	return '/'
})();

const swPath = `${basePath}/service-worker.js`;
const swScope = `${basePath}/`;

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
			.then((registration) => {
				// Send BASE_PATH to service worker
				const sendBasePath = () => {
					registration.active?.postMessage({ type: 'SET_BASE_PATH', basePath: basePath });
				};

				if (registration.active) {
					sendBasePath();
				}

				// Also send when a new service worker becomes active
				registration.addEventListener('updatefound', () => {
					const newWorker = registration.installing;
					newWorker?.addEventListener('statechange', () => {
						if (newWorker.state === 'activated') {
							sendBasePath();
						}
					});
				});
			})
			.catch(err => {
				console.error('Service worker registration failed:', err);
			});
	});
}
