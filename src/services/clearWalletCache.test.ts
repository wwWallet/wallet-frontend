// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearWalletCache } from './clearWalletCache';

const { stores } = vi.hoisted(() => ({
	stores: new Map<string, { clear: ReturnType<typeof vi.fn> }>(),
}));

vi.mock('localforage', () => ({
	default: {
		createInstance: ({ storeName }: { storeName: string }) => {
			const store = { clear: vi.fn().mockResolvedValue(undefined) };
			stores.set(storeName, store);
			return store;
		},
	},
}));

const derivedStoreNames = ['externalEntities', 'accountInfo', 'proxyCache'];
const preservedStoreNames = ['users', 'UserHandleToUserID'];

describe('clearWalletCache', () => {
	beforeEach(() => {
		for (const store of stores.values()) {
			store.clear.mockReset().mockResolvedValue(undefined);
		}
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('clears derived data and disposable caches while preserving offline app caches', async () => {
		const disposableCacheNames = [
			'images',
			'app-shell',
			'theme',
		];
		const offlineCacheNames = [
			`workbox-precache-v2-${new URL('/wallet/', window.location.origin).href}`,
			'app-shell:/wallet/',
			'fonts',
		];
		const unrelatedCacheName = 'other-app-cache';
		const keys = vi.fn().mockResolvedValue([
			...disposableCacheNames,
			...offlineCacheNames,
			unrelatedCacheName,
		]);
		const deleteCache = vi.fn().mockResolvedValue(true);
		vi.stubGlobal('caches', {
			keys,
			delete: deleteCache,
		});

		await clearWalletCache();

		for (const name of preservedStoreNames) {
			expect(stores.get(name)?.clear).not.toHaveBeenCalled();
		}
		for (const name of derivedStoreNames) {
			expect(stores.get(name)?.clear).toHaveBeenCalledOnce();
		}
		expect(keys).toHaveBeenCalledOnce();
		expect(deleteCache.mock.calls.map(([name]) => name)).toEqual(disposableCacheNames);
		for (const name of offlineCacheNames) {
			expect(deleteCache).not.toHaveBeenCalledWith(name);
		}
		expect(deleteCache).not.toHaveBeenCalledWith(unrelatedCacheName);
	});

	it('still clears IndexedDB when Cache Storage is unavailable', async () => {
		vi.stubGlobal('caches', undefined);

		await clearWalletCache();

		for (const name of derivedStoreNames) {
			expect(stores.get(name)?.clear).toHaveBeenCalledOnce();
		}
	});

	it('treats an already-absent cache as successfully cleared', async () => {
		const deleteCache = vi.fn().mockResolvedValue(false);
		vi.stubGlobal('caches', {
			keys: vi.fn().mockResolvedValue(['images']),
			delete: deleteCache,
		});

		await expect(clearWalletCache()).resolves.toBeUndefined();
		expect(deleteCache).toHaveBeenCalledWith('images');
	});

	it('propagates Cache Storage errors so the caller can show failure feedback', async () => {
		const cacheError = new Error('Cache Storage failed');
		vi.stubGlobal('caches', {
			keys: vi.fn().mockResolvedValue(['images']),
			delete: vi.fn().mockRejectedValue(cacheError),
		});

		await expect(clearWalletCache()).rejects.toBe(cacheError);
	});
});
