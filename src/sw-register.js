import { BASE_PATH, MODE } from './config';

const swScope = BASE_PATH.replace(/\/?$/, '/');
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
