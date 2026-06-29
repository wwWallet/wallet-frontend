import { BASE_PATH } from './config';

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

if ('serviceWorker' in navigator) {
	window.addEventListener('load', async () => {
		// Only exists after a build; the dev server serves index.html instead.
		try {
			const res = await fetch(swPath, { method: 'HEAD' });
			const contentType = res.headers.get('content-type') || '';
			if (!res.ok || !contentType.includes('javascript')) {
				return;
			}
		} catch {
			return;
		}

		const trustedSwUrl = swPolicy ? swPolicy.createScriptURL(swPath) : swPath;
		navigator.serviceWorker
			.register(trustedSwUrl, { scope: swScope })
			.catch(err => {
				console.error('Service worker registration failed:', err);
			});
	});
}
