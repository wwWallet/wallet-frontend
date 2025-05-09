import { useMemo, useRef, useContext, useEffect } from 'react';
import axios from 'axios';
import { IHttpProxy } from '../../interfaces/IHttpProxy';
import StatusContext from '@/context/StatusContext';
import { addItem, getItem, removeItem } from '@/indexedDB';
// @ts-ignore
const walletBackendServerUrl = import.meta.env.VITE_WALLET_BACKEND_URL;
const inFlightRequests = new Map<string, Promise<any>>();

const parseCacheControl = (header: string) =>
	Object.fromEntries(
		header
			.split(',')
			.map(d => {
				const [key, value] = d.trim().split('=').map(v => v.trim());
				const num = Number(value);
				return [key, isNaN(num) ? value : num];
			})
	);

export function useHttpProxy(): IHttpProxy {
	const { isOnline } = useContext(StatusContext);
	const isOnlineRef = useRef(isOnline);

	useEffect(() => {
		isOnlineRef.current = isOnline;
	}, [isOnline]);

	const proxy = useMemo(() => ({
		async get(
			url: string,
			headers: Record<string, string> = {},
			options?: { useCache?: boolean; }
		): Promise<{ status: number; headers: Record<string, unknown>; data: unknown }> {
			const useCache = options?.useCache;
			const now = Math.floor(Date.now() / 1000);
			const online = isOnlineRef.current;
			const isBinaryRequest = /\.(png|jpe?g|gif|webp|bmp|tiff?|ico)(\?.*)?(#.*)?$/i.test(url);
			const cacheKey = isBinaryRequest ? `blob:${url}` : `data:${url}`;

			if (useCache && online !== false) {
				try {
					const cached = await getItem('proxyCache', cacheKey, 'proxyCache');

					const cachedData = cached?.data;
					const expiry = cached?.expiry;
					const isInCache = !!cachedData && !!expiry;

					if (isInCache) {
						const isFresh = now < expiry;

						if (online === null || isFresh) {
							return cachedData;
						}
					}

				} catch (err) {
					console.warn('[Proxy] Failed cache read', err);
				}
			}

			// If offline is false, do not attempt network request
			if (online === false) {
				const fallback = await getItem('proxyCache', cacheKey, 'proxyCache');

				if (fallback?.data) {
					return fallback.data;
				}

				return {
					data: 'No cached response available and offline',
					headers: {},
					status: 504,
				};
			}

			// Fallback to backend `/proxy`
			if (inFlightRequests.has(cacheKey)) {
				return inFlightRequests.get(cacheKey);
			}

			const requestPromise = (async () => {
				try {
					const response = await axios.post(`${walletBackendServerUrl}/proxy`, {
						headers,
						url,
						method: 'get',
					}, {
						timeout: 2500,
						headers: {
							Authorization: 'Bearer ' + JSON.parse(sessionStorage.getItem('appToken')!),
						},
						...(isBinaryRequest && { responseType: 'arraybuffer' }),
					}
					);

					const res = response.data;
					const cacheControlHeader = response.headers?.['cache-control'];
					const contentTypeHeader = response.headers?.['content-type'];

					let shouldCache = useCache !== undefined;
					let maxAge = 60 * 60 * 24 * 30; // default: 30 days

					// Handle Cache-Control logic
					if (typeof cacheControlHeader === 'string') {
						const lower = cacheControlHeader.toLowerCase();
						if (lower.includes('no-store')) shouldCache = false;
						else if (lower.includes('no-cache')) maxAge = 0;
						else {
							const parsed = parseCacheControl(lower);
							if (typeof parsed['max-age'] === 'number') {
								maxAge = parsed['max-age'];
								if (maxAge < 0) shouldCache = false;
							}
						}
					}

					// blob response
					if (isBinaryRequest && typeof contentTypeHeader === 'string') {
						const arrayBuffer = res as ArrayBuffer;
						const blob = new Blob([new Uint8Array(arrayBuffer)], { type: contentTypeHeader });
						const blobUrl = URL.createObjectURL(blob);

						const responseToCache = {
							status: response.status,
							headers: response.headers,
							data: blobUrl,
						};

						if (shouldCache) {
							await addItem('proxyCache', cacheKey, {
								data: responseToCache,
								expiry: now + maxAge,
							}, 'proxyCache');
						}

						return responseToCache;
					}

					// Non-blob response
					if (shouldCache) {
						await addItem('proxyCache', cacheKey, {
							data: {
								status: res.status,
								headers: res.headers,
								data: res.data,
							},
							expiry: now + maxAge,
						}, 'proxyCache');
					}

					return {
						status: res.status,
						headers: res.headers,
						data: res.data,
					};

				} catch (err) {
					const fallback = await getItem('proxyCache', cacheKey, 'proxyCache');
					if (fallback?.data) {
						return {
							status: 200,
							headers: {},
							data: fallback.data,
						};
					}

					if (isOnlineRef.current) {
						await removeItem('proxyCache', cacheKey, 'proxyCache');
					}

					return {
						status: err.response?.status || 500,
						headers: err.response?.headers || {},
						data: err.response?.data || 'GET proxy failed',
					};
				} finally {
					inFlightRequests.delete(cacheKey);
				}
			})();

			inFlightRequests.set(cacheKey, requestPromise);
			return requestPromise;
		},

		async post(
			url: string,
			body: any,
			headers: Record<string, string>
		): Promise<{ status: number; headers: Record<string, unknown>; data: unknown }> {
			try {
				const response = await axios.post(`${walletBackendServerUrl}/proxy`, {
					headers: headers,
					url: url,
					method: 'post',
					data: body,
				}, {
					timeout: 2500,
					headers: {
						Authorization: 'Bearer ' + JSON.parse(sessionStorage.getItem('appToken'))
					}
				});
				return response.data;
			} catch (err) {
				return {
					data: err.response?.data || 'POST proxy failed',
					headers: err.response?.headers || {},
					status: err.response?.status || 500,
				};
			}
		},
	}), []);

	return proxy;
}
