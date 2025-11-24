const appMode = import.meta.env.MODE || 'development';

const tt = window.trustedTypes || window.TrustedTypes;

const swPolicy = tt
	? tt.createPolicy('sw-register', {
		createScriptURL(url) {
			if (url === '/service-worker.js') {
				return url;
			}
			throw new TypeError('Untrusted service worker URL blocked by Trusted Types policy');
		}
	})
	: null;

if (appMode === 'production' && 'serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		const swUrl = '/service-worker.js';
		const trustedSwUrl = swPolicy ? swPolicy.createScriptURL(swUrl) : swUrl;
		navigator.serviceWorker
			.register(trustedSwUrl, { scope: '/' })
			.catch(err => {
				console.error('Service worker registration failed:', err);
			});
	});
}
