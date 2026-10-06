import { clearIndexedDbCache } from '@/indexedDB';

const DISPOSABLE_CACHE_NAMES = new Set([
	'images',
	'app-shell', // Legacy, replaced by the scoped app-shell cache.
	'theme', // Legacy, replaced by the branding precache.
]);

/** Clear derived data and disposable runtime caches without breaking offline startup. */
export async function clearWalletCache(): Promise<void> {
	await clearIndexedDbCache();

	if (!window.caches) return;

	const cacheNames = await window.caches.keys();
	await Promise.all(cacheNames
		.filter(name => DISPOSABLE_CACHE_NAMES.has(name))
		.map(name => window.caches.delete(name)));
}
