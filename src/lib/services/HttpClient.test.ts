// src/lib/services/HttpClient.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import HttpClient from './HttpClient';

// Mock dependencies
vi.mock('@/indexedDB', () => ({
	getItem: vi.fn(),
	addItem: vi.fn(),
}));

vi.mock('axios', () => ({
	default: {
		request: vi.fn(),
	},
}));

vi.mock('@/config', () => ({
	BACKEND_URL: 'http://backend.localhost',
	OHTTP_RELAY: 'http://relay.localhost',
}));

vi.mock('../tenant', () => ({
	getTenantFromUrlPath: vi.fn(() => 'default'),
}));

vi.mock('@/logger', () => ({
	logger: {
		debug: vi.fn(),
		warn: vi.fn(),
	},
}));

vi.mock('@/lib/utils/ohttpHelpers', () => ({
	encryptedHttpRequest: vi.fn(),
}));

describe('HttpClient', () => {
	let mockGetItem: ReturnType<typeof vi.fn>;
	let mockAddItem: ReturnType<typeof vi.fn>;
	let mockAxiosRequest: ReturnType<typeof vi.fn>;

	const now = () => Math.floor(Date.now() / 1000);

	beforeEach(async () => {
		vi.clearAllMocks();

		const indexedDB = await import('@/indexedDB');
		mockGetItem = indexedDB.getItem as ReturnType<typeof vi.fn>;
		mockAddItem = indexedDB.addItem as ReturnType<typeof vi.fn>;

		const axios = await import('axios');
		mockAxiosRequest = axios.default.request as ReturnType<typeof vi.fn>;

		// Mock sessionStorage
		vi.stubGlobal('sessionStorage', {
			getItem: vi.fn(() => '"test-token"'),
		});
	});

		afterEach(() => {
				vi.unstubAllGlobals();
		});

		describe('cache behavior', () => {
				it('returns fresh cached response without network request', async () => {
						const cachedData = {
								data: { status: 200, headers: {}, data: { foo: 'bar' } },
								expiry: now() + 1000, // fresh
						};
						mockGetItem.mockResolvedValue(cachedData);

						const client = new HttpClient(true, null);
						const response = await client.get('http://backend.localhost/api/test');

						expect(response.status).toBe(200);
						expect(response.data).toEqual({ foo: 'bar' });
						expect(mockAxiosRequest).not.toHaveBeenCalled();
				});

				it('fetches from network when cache is stale', async () => {
						const cachedData = {
								data: { status: 200, headers: {}, data: { old: 'data' } },
								expiry: now() - 1000, // expired
						};
						mockGetItem.mockResolvedValue(cachedData);
						mockAxiosRequest.mockResolvedValue({
								status: 200,
								headers: { 'content-type': 'application/json' },
								data: { new: 'data' },
						});

						const client = new HttpClient(true, null);
						const response = await client.get('http://backend.localhost/api/test');

						expect(response.data).toEqual({ new: 'data' });
						expect(mockAxiosRequest).toHaveBeenCalled();
				});

				it('fetches from network when no cache exists', async () => {
						mockGetItem.mockResolvedValue(null);
						mockAxiosRequest.mockResolvedValue({
								status: 200,
								headers: {},
								data: { fresh: 'data' },
						});

						const client = new HttpClient(true, null);
						const response = await client.get('http://backend.localhost/api/test');

						expect(response.data).toEqual({ fresh: 'data' });
						expect(mockAxiosRequest).toHaveBeenCalled();
				});

				it('caches response after successful network request', async () => {
						mockGetItem.mockResolvedValue(null);
						mockAxiosRequest.mockResolvedValue({
								status: 200,
								headers: {},
								data: { cached: 'data' },
						});

						const client = new HttpClient(true, null);
						await client.get('http://backend.localhost/api/test');

						expect(mockAddItem).toHaveBeenCalledWith(
								'remoteCache',
								expect.any(String),
								expect.objectContaining({
										data: expect.objectContaining({ data: { cached: 'data' } }),
										expiry: expect.any(Number),
								}),
								'remoteCache'
						);
				});

				it('does not cache when useCache is false', async () => {
						mockGetItem.mockResolvedValue(null);
						mockAxiosRequest.mockResolvedValue({
								status: 200,
								headers: {},
								data: { nocache: 'data' },
						});

						const client = new HttpClient(true, null);
						await client.get('http://backend.localhost/api/test', {}, { useCache: false });

						expect(mockAddItem).not.toHaveBeenCalled();
				});

				it('does not cache when Cache-Control: no-store', async () => {
						mockGetItem.mockResolvedValue(null);
						mockAxiosRequest.mockResolvedValue({
								status: 200,
								headers: { 'cache-control': 'no-store' },
								data: { nostore: 'data' },
						});

						const client = new HttpClient(true, null);
						await client.get('http://backend.localhost/api/test');

						expect(mockAddItem).not.toHaveBeenCalled();
				});

				it('respects Cache-Control max-age', async () => {
						mockGetItem.mockResolvedValue(null);
						mockAxiosRequest.mockResolvedValue({
								status: 200,
								headers: { 'cache-control': 'max-age=3600' },
								data: { data: 'test' },
						});

						const client = new HttpClient(true, null);
						const currentTime = now();
						await client.get('http://backend.localhost/api/test');

						expect(mockAddItem).toHaveBeenCalledWith(
								'remoteCache',
								expect.any(String),
								expect.objectContaining({
										expiry: expect.any(Number),
								}),
								'remoteCache'
						);

						const savedExpiry = mockAddItem.mock.calls[0][2].expiry;
						expect(savedExpiry).toBeGreaterThanOrEqual(currentTime + 3600 - 1);
						expect(savedExpiry).toBeLessThanOrEqual(currentTime + 3600 + 1);
				});
		});

		describe('offline behavior', () => {
				it('returns stale cache when offline', async () => {
						const cachedData = {
								data: { status: 200, headers: {}, data: { stale: 'data' } },
								expiry: now() - 1000, // expired
						};
						mockGetItem.mockResolvedValue(cachedData);

						const client = new HttpClient(false, null); // offline
						const response = await client.get('http://backend.localhost/api/test');

						expect(response.data).toEqual({ stale: 'data' });
						expect(mockAxiosRequest).not.toHaveBeenCalled();
				});

				it('throws when offline and no cache exists', async () => {
						mockGetItem.mockResolvedValue(null);

						const client = new HttpClient(false, null);

						await expect(client.get('http://backend.localhost/api/test'))
								.rejects.toThrow('Offline and no cache');
				});
		});

		describe('error fallback', () => {
				it('returns stale cache on network error', async () => {
						const cachedData = {
								data: { status: 200, headers: {}, data: { fallback: 'data' } },
								expiry: now() - 1000, // expired
						};
						// First call returns null (for fresh check), second returns stale cache
						mockGetItem
								.mockResolvedValueOnce(null)
								.mockResolvedValueOnce(cachedData);
						mockAxiosRequest.mockRejectedValue(new Error('Network error'));

						const client = new HttpClient(true, null);
						const response = await client.get('http://backend.localhost/api/test');

						expect(response.data).toEqual({ fallback: 'data' });
				});

				it('throws when network error and no cache', async () => {
						mockGetItem.mockResolvedValue(null);
						mockAxiosRequest.mockRejectedValue(new Error('Network error'));

						const client = new HttpClient(true, null);

						await expect(client.get('http://backend.localhost/api/test'))
								.rejects.toThrow('Network error');
				});
		});

		describe('POST requests', () => {
				it('creates unique cache keys for different POST bodies', async () => {
						mockGetItem.mockResolvedValue(null);
						mockAxiosRequest.mockResolvedValue({
								status: 200,
								headers: {},
								data: { result: 'ok' },
						});

						const client = new HttpClient(true, null);

						await client.post('http://backend.localhost/api/test', { a: 1 });
						await client.post('http://backend.localhost/api/test', { b: 2 });

						expect(mockAddItem).toHaveBeenCalledTimes(2);
						const cacheKey1 = mockAddItem.mock.calls[0][1];
						const cacheKey2 = mockAddItem.mock.calls[1][1];
						expect(cacheKey1).not.toBe(cacheKey2);
				});

				it('returns cached POST response for same body', async () => {
						const body = { subject_id: 'test', subject_type: 'url' };
						const cachedData = {
								data: { status: 200, headers: {}, data: { cached: 'post' } },
								expiry: now() + 1000,
						};
						mockGetItem.mockResolvedValue(cachedData);

						const client = new HttpClient(true, null);
						const response = await client.post('http://backend.localhost/api/resolve', body);

						expect(response.data).toEqual({ cached: 'post' });
						expect(mockAxiosRequest).not.toHaveBeenCalled();
				});
		});

		describe('request deduplication', () => {
				it('deduplicates concurrent identical requests', async () => {
						mockGetItem.mockResolvedValue(null);

						let resolveRequest: (value: unknown) => void;
						const requestPromise = new Promise((resolve) => {
								resolveRequest = resolve;
						});

						mockAxiosRequest.mockReturnValue(requestPromise);

						const client = new HttpClient(true, null);

						// Start two concurrent requests
						const promise1 = client.get('http://backend.localhost/api/test');
						const promise2 = client.get('http://backend.localhost/api/test');

						// Resolve the network request
						resolveRequest!({
								status: 200,
								headers: {},
								data: { dedupe: 'test' },
						});

						const [response1, response2] = await Promise.all([promise1, promise2]);

						expect(response1.data).toEqual({ dedupe: 'test' });
						expect(response2.data).toEqual({ dedupe: 'test' });
						expect(mockAxiosRequest).toHaveBeenCalledTimes(1);
				});
		});

		describe('headers', () => {
				it('adds tenant header for backend requests', async () => {
						mockGetItem.mockResolvedValue(null);
						mockAxiosRequest.mockResolvedValue({
								status: 200,
								headers: {},
								data: {},
						});

						const client = new HttpClient(true, null);
						await client.get('http://backend.localhost/api/test');

						expect(mockAxiosRequest).toHaveBeenCalledWith(
								expect.objectContaining({
										headers: expect.objectContaining({
												'X-Tenant-ID': 'default',
										}),
								})
						);
				});

				it('adds authorization header for backend requests', async () => {
						mockGetItem.mockResolvedValue(null);
						mockAxiosRequest.mockResolvedValue({
								status: 200,
								headers: {},
								data: {},
						});

						const client = new HttpClient(true, null);
						await client.get('http://backend.localhost/api/test');

						expect(mockAxiosRequest).toHaveBeenCalledWith(
								expect.objectContaining({
										headers: expect.objectContaining({
												Authorization: 'Bearer test-token',
										}),
								})
						);
				});
		});

		describe('binary requests', () => {
				it('detects binary requests by URL extension', async () => {
						mockGetItem.mockResolvedValue(null);
						mockAxiosRequest.mockResolvedValue({
								status: 200,
								headers: { 'content-type': 'image/png' },
								data: new ArrayBuffer(8),
						});

						const client = new HttpClient(true, null);
						const response = await client.get('http://example.com/image.png');

						expect(mockAxiosRequest).toHaveBeenCalledWith(
								expect.objectContaining({
										responseType: 'arraybuffer',
								})
						);
						// Response data should be a blob URL
						expect(typeof response.data).toBe('string');
						expect((response.data as string).startsWith('blob:')).toBe(true);
				});

				it('caches binary data and reconstructs blob URL on read', async () => {
						const binaryData = new ArrayBuffer(8);
						mockGetItem.mockResolvedValue({
								data: {
										status: 200,
										headers: {},
										rawBytes: binaryData,
										contentType: 'image/png',
								},
								expiry: now() + 1000,
						});

						const client = new HttpClient(true, null);
						const response = await client.get('http://example.com/image.png');

						expect(typeof response.data).toBe('string');
						expect((response.data as string).startsWith('blob:')).toBe(true);
				});
		});

	describe('isOnline = null (unknown)', () => {
		it('returns any cached data when online status is unknown', async () => {
			const cachedData = {
				data: { status: 200, headers: {}, data: { unknown: 'state' } },
				expiry: now() - 1000, // expired but should still return
			};
			mockGetItem.mockResolvedValue(cachedData);

			const client = new HttpClient(null, null); // unknown online status
			const response = await client.get('http://backend.localhost/api/test');

			// When isOnline is null, should return cache even if expired
			expect(response.data).toEqual({ unknown: 'state' });
		});
	});
});
