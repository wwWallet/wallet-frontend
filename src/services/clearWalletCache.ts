import { BASE_PATH } from '@/config';
import { clearIndexedDbCache } from '@/indexedDB';

/** Clear derived IndexedDB data and caches created by this wallet's service worker. */
export async function clearWalletCache(): Promise<void> {
	await clearIndexedDbCache();

	if (!window.caches) return;

	const scopePath = BASE_PATH.replace(/\/?$/, '/');
	const scopeUrl = new URL(scopePath, window.location.origin).href;
	const walletCacheNames = new Set([
		`workbox-precache-v2-${scopeUrl}`,
		`app-shell:${scopePath}`,
		'images',
		'fonts',
		'app-shell',
		'theme',
	]);
	const names = await window.caches.keys();
	await Promise.all(names
		.filter(name => walletCacheNames.has(name))
		.map(name => window.caches.delete(name)));
}
