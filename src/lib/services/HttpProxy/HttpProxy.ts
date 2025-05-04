import { useMemo, useRef, useContext, useEffect } from 'react';
import axios from 'axios';
import { IHttpProxy } from '../../interfaces/IHttpProxy';
import StatusContext from '@/context/StatusContext';
import { addItem, getItem, removeItem } from '@/indexedDB';
// @ts-ignore
const walletBackendServerUrl = import.meta.env.VITE_WALLET_BACKEND_URL;

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
			headers: Record<string, string>,
			options?: { useCache: boolean }
		): Promise<{ status: number; headers: Record<string, unknown>; data: unknown }> {
			const useCache = options?.useCache ?? undefined;
			const now = Math.floor(Date.now() / 1000);
			const online = isOnlineRef.current;

			const cacheKey = `data:${url}`;

			if (useCache && isOnline !== false) {
				try {
					const cached = await getItem('proxyCache', cacheKey, 'proxyCache');

					const cachedData = cached?.data;
					const expiry = cached?.expiry;
					const isInCache = !!cachedData && !!expiry;

					if (isInCache) {
						const isFresh = now < expiry;

						if (online === null || isFresh) {
							return cachedData;
						} else {
							await removeItem('proxyCache', cacheKey, 'proxyCache');
						}
					}

				} catch (err) {
					console.warn('[Proxy] Failed cache read', err);
					if (online === null) {
						return {
							data: 'Failed cache read and online status is unknown',
							headers: {},
							status: 504,
						};
					}
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
			try {
				const response = await axios.post(`${walletBackendServerUrl}/proxy`, {
					headers,
					url,
					method: 'get',
				}, {
					timeout: 2500,
					headers: {
						Authorization: 'Bearer ' + JSON.parse(sessionStorage.getItem('appToken'))
					}
				});

				const res = response.data;
				const cacheControlHeader = res.headers?.['cache-control'];

				let shouldCache = useCache !== false;
				let maxAge = 60 * 60 * 24 * 30; // default: 30 days

				if (typeof cacheControlHeader === 'string') {
					const lower = cacheControlHeader.toLowerCase();

					if (lower.includes('no-store') || lower.includes('no-cache')) {
						shouldCache = false;
					} else {
						const parsed = parseCacheControl(lower);
						if (typeof parsed['max-age'] === 'number') {
							maxAge = parsed['max-age'];
							if (maxAge < 0) {
								shouldCache = false;
							}
						}
					}
				}

				if (shouldCache) {
					await addItem('proxyCache', cacheKey, { data: res, expiry: now + maxAge }, 'proxyCache');
				}

				return res;
			} catch (err) {
				const fallback = await getItem('proxyCache', cacheKey, 'proxyCache');
				if (fallback?.data) {
					return fallback.data;
				}
				return {
					data: err.response?.data || 'GET proxy failed',
					headers: err.response?.headers || {},
					status: err.response?.status || 500,
				};
			}
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
