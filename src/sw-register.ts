import { BASE_PATH } from './config';
import type {
	TrustedScriptURL,
	TrustedTypePolicyFactory,
	TrustedTypesWindow,
} from 'trusted-types/lib';

const swScope = BASE_PATH.replace(/\/?$/, '/');
const swPath = `${swScope}service-worker.js`;

type WindowWithLegacyTrustedTypes = Window & Partial<TrustedTypesWindow> & {
	TrustedTypes?: TrustedTypePolicyFactory;
};

type ServiceWorkerScriptUrl = string | URL | TrustedScriptURL;

const registerServiceWorker = (
	scriptUrl: ServiceWorkerScriptUrl,
	options?: RegistrationOptions,
): Promise<ServiceWorkerRegistration> => {
	// The DOM typings do not yet include TrustedScriptURL for this browser API.
	return navigator.serviceWorker.register(scriptUrl as unknown as string, options);
};

const trustedTypesWindow = window as WindowWithLegacyTrustedTypes;
const tt = trustedTypesWindow.trustedTypes || trustedTypesWindow.TrustedTypes;

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
		registerServiceWorker(trustedSwUrl, {
			scope: swScope,
			// Always revalidate imports during service worker update checks.
			updateViaCache: 'none',
		})
			.catch(err => {
				console.error('Service worker registration failed:', err);
			});
	});
}
