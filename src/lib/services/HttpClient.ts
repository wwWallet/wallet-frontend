import axios from 'axios';
import { getTenantFromUrlPath } from '../tenant';
import { addItem, getItem } from '@/indexedDB';
import { BACKEND_URL, OHTTP_RELAY } from '@/config';
import { encryptedHttpRequest, HpkeConfig } from '@/lib/utils/ohttpHelpers';
import { logger } from '@/logger';

export type HttpClientRequestOptions = {
	useCache?: boolean;
};

type RawResponse = {
	status: number;
	headers: Record<string, unknown>;
	data: unknown;
};

type CachedData = {
	status: number;
	headers: Record<string, unknown>;
	data?: unknown;
	rawBytes?: ArrayBuffer;
	contentType?: string;
};

type CachedEntry = {
	data: CachedData;
	expiry: number;
};

type DoRequestParams = {
	method: 'GET' | 'POST';
	url: string;
	body: string | object | undefined;
	headers: Record<string, string> | undefined;
	tenantId: string;
	targetIsBackend: boolean;
	isBinaryRequest: boolean;
};

const TIMEOUT = 10 * 1000;

/**
 * Http Client with built-in support for:
 * - Caching with Cache-Control respect and offline fallback
 * - Request deduplication
 * - Optional oblivious HTTP via OHTTP_RELAY and provided HpkeConfig
 */
export default class HttpClient {
	#isOnline: boolean | null;
	#obliviousKeyConfig: HpkeConfig | null;
	#inFlightRequests = new Map<string, Promise<RawResponse>>();

	constructor(isOnline: boolean | null = true, obliviousKeyConfig: HpkeConfig | null = null) {
		this.#isOnline = isOnline;
		this.#obliviousKeyConfig = obliviousKeyConfig;
	}

	/**
	 * Performs a GET request with caching, offline support, and optional oblivious HTTP.
	 *
	 * @param url The URL to request
	 * @param headers Optional headers to include in the request
	 * @param options Request options, including cache control
	 * @returns A promise resolving to the response data, status, and headers
	 * @throws An error if the request fails and no cache is available
	 */
	public async get(
		url: string,
		headers?: Record<string, string>,
		options?: HttpClientRequestOptions,
	): Promise<RawResponse> {
		return this.#request('GET', url, undefined, headers, options);
	}

	/**
	 * Performs a POST request with caching, offline support, and optional oblivious HTTP.
	 *
	 * @param url The URL to request
	 * @param body The request body, either as a string or an object
	 * @param headers Optional headers to include in the request
	 * @param options Request options, including cache control
	 * @returns A promise resolving to the response data, status, and headers
	 * @throws An error if the request fails and no cache is available
	 */
	public async post(
		url: string,
		body: string | object,
		headers?: Record<string, string>,
		options?: HttpClientRequestOptions,
	): Promise<RawResponse> {
		return this.#request('POST', url, body, headers, options);
	}

	async #request(
		method: 'GET' | 'POST',
		url: string,
		body?: string | object,
		headers?: Record<string, string>,
		options?: HttpClientRequestOptions,
	): Promise<RawResponse> {
		const { useCache = false } = options || {};
		const now = Math.floor(Date.now() / 1000);
		const isBinaryRequest = /\.(png|jpe?g|gif|webp|bmp|tiff?|ico)(\?.*)?(#.*)?$/i.test(url);

		const cacheKey = [
			isBinaryRequest ? 'blob' : 'data',
			url,
			body ? await this.#hashBody(body) : undefined,
		].join('::');

		const isOffline = this.#isOnline === false;

		if (isOffline) {
			const fallback = await this.#readCache(cacheKey, now, true);
			if (fallback) return fallback;
			throw new Error(`Offline and no cache for ${cacheKey}`);
		}

		if (useCache) {
			const cached = await this.#readCache(cacheKey, now);
			if (cached) return cached;
		}

		if (this.#inFlightRequests.has(cacheKey)) {
			return this.#inFlightRequests.get(cacheKey)!;
		}

		const requestPromise = this.#executeRequest(
			method,
			url,
			body,
			headers,
			useCache,
			now,
			cacheKey,
			isBinaryRequest,
		);

		this.#inFlightRequests.set(cacheKey, requestPromise);
		return requestPromise;
	}

	async #executeRequest(
		method: 'GET' | 'POST',
		url: string,
		body: string | object | undefined,
		headers: Record<string, string> | undefined,
		useCache: boolean,
		now: number,
		cacheKey: string,
		isBinaryRequest: boolean,
	): Promise<RawResponse> {
		try {
			const tenantId = getTenantFromUrlPath() || 'default';
			const targetIsBackend = new URL(url).origin === new URL(BACKEND_URL).origin;

			const requestMethod =
				this.#obliviousKeyConfig !== null ? this.#doOhttpRequest : this.#doAxiosRequest;
			const requestParams: DoRequestParams = {
				method,
				url,
				body,
				headers,
				tenantId,
				targetIsBackend,
				isBinaryRequest,
			};

			const {
				status,
				headers: responseHeaders,
				data: rawData,
			} = await requestMethod(requestParams);

			const { shouldCache, maxAge } = this.#parseCacheSettings(
				useCache,
				responseHeaders['cache-control'] as string | undefined,
			);

			if (isBinaryRequest) {
				const contentType =
					(responseHeaders['content-type'] as string) || 'application/octet-stream';
				const blob = new Blob([new Uint8Array(rawData as ArrayBuffer)], { type: contentType });
				const blobUrl = URL.createObjectURL(blob);

				if (shouldCache) {
					await this.#addToCache(cacheKey, {
						data: {
							status,
							headers: responseHeaders,
							contentType,
							rawBytes: rawData as ArrayBuffer,
						},
						expiry: now + maxAge,
					});
				}

				return { status, headers: responseHeaders, data: blobUrl };
			}

			if (shouldCache) {
				await this.#addToCache(cacheKey, {
					data: {
						status,
						headers: responseHeaders,
						data: rawData,
					},
					expiry: now + maxAge,
				});
			}

			return { status, headers: responseHeaders, data: rawData };
		} catch (err) {
			// Try stale cache on error
			const fallback = await this.#readCache(cacheKey, now, true);
			if (fallback) {
				logger.warn('[HttpClient] Request failed, using stale cache', err);
				return fallback;
			}
			throw err;
		} finally {
			this.#inFlightRequests.delete(cacheKey);
		}
	}

	async #doOhttpRequest({
		method,
		url,
		body,
		headers,
		tenantId,
		targetIsBackend,
		isBinaryRequest,
	}: DoRequestParams): Promise<RawResponse> {
		logger.debug('Using oblivious');

		const ohttpResponse = await encryptedHttpRequest(OHTTP_RELAY, this.#obliviousKeyConfig!, {
			method,
			headers: {
				...headers,
				...(targetIsBackend && { 'X-Tenant-ID': tenantId }),
			},
			url,
			...(body && { body }),
		});

		const status = ohttpResponse.status;
		const responseHeaders = ohttpResponse.headers || {};

		if (status < 200 || status > 299) {
			throw new Error(`Request failed with status code ${status}`);
		}

		let data: unknown;
		if (isBinaryRequest) {
			data = ohttpResponse.body;
		} else {
			const contentType = responseHeaders['content-type'] as string | undefined;
			if (contentType?.trim().startsWith('application/json')) {
				data = JSON.parse(new TextDecoder().decode(ohttpResponse.body));
			} else {
				data = new TextDecoder().decode(ohttpResponse.body);
			}
		}

		return { status, headers: responseHeaders, data };
	}

	async #doAxiosRequest({
		method,
		url,
		body,
		headers,
		tenantId,
		targetIsBackend,
		isBinaryRequest,
	}: DoRequestParams): Promise<RawResponse> {
		const response = await axios.request({
			method,
			url,
			data: body,
			timeout: TIMEOUT,
			headers: {
				...headers,
				...(targetIsBackend && { 'X-Tenant-ID': tenantId }),
				...(targetIsBackend && {
					Authorization: 'Bearer ' + JSON.parse(sessionStorage.getItem('appToken')!),
				}),
			},
			...(isBinaryRequest && { responseType: 'arraybuffer' }),
		});

		return {
			status: response.status,
			headers: response.headers as Record<string, unknown>,
			data: response.data,
		};
	}

	async #readCache(
		cacheKey: string,
		now: number,
		ignoreExpiry = false,
	): Promise<RawResponse | null> {
		try {
			const cached = await this.#getFromCache(cacheKey);
			if (!cached?.data || !cached?.expiry) return null;

			const isFresh = now < cached.expiry;
			if (!ignoreExpiry && this.#isOnline !== null && !isFresh) return null;

			const { status, headers, data, rawBytes, contentType } = cached.data;

			if (rawBytes) {
				const blob = new Blob([new Uint8Array(rawBytes)], {
					type: contentType || 'application/octet-stream',
				});
				return { status, headers, data: URL.createObjectURL(blob) };
			}

			return { status, headers, data };
		} catch (err) {
			logger.warn('[HttpClient] Failed cache read', err);
			return null;
		}
	}

	#parseCacheSettings(useCache: boolean, cacheControlHeader?: string) {
		let shouldCache = useCache;
		let maxAge = 60 * 30;

		if (shouldCache && typeof cacheControlHeader === 'string') {
			const lower = cacheControlHeader.toLowerCase();
			if (lower.includes('no-store')) shouldCache = false;
			else if (lower.includes('no-cache')) maxAge = 0;
			else {
				const parsed = this.#parseCacheControl(lower);
				if (typeof parsed['max-age'] === 'number') {
					maxAge = parsed['max-age'];
					if (maxAge < 0) shouldCache = false;
				}
			}
		}

		return { shouldCache, maxAge };
	}

	#parseCacheControl(header: string): Record<string, string | number> {
		return Object.fromEntries(
			header.split(',').map((d) => {
				const [key, value] = d
					.trim()
					.split('=')
					.map((v) => v.trim());
				const num = Number(value);
				return [key, isNaN(num) ? value : num];
			}),
		);
	}

	async #hashBody(body: unknown): Promise<string> {
		const json = JSON.stringify(body);
		const data = new TextEncoder().encode(json);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		return Array.from(new Uint8Array(hashBuffer))
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');
	}

	async #getFromCache(cacheKey: string): Promise<CachedEntry | null> {
		return getItem('remoteCache', cacheKey, 'remoteCache');
	}

	async #addToCache(cacheKey: string, cached: CachedEntry): Promise<void> {
		await addItem('remoteCache', cacheKey, cached, 'remoteCache');
	}
}
