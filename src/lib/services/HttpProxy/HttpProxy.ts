import { useMemo, useRef, useContext, useEffect } from 'react';
import axios, { AxiosError, AxiosHeaders } from 'axios';
import { IHttpProxy, RequestHeaders, ResponseHeaders } from '../../interfaces/IHttpProxy';
import StatusContext from '@/context/StatusContext';
import { addItem, getItem } from '@/indexedDB';
import { encryptedHttpRequest, toArrayBuffer } from '@/lib/utils/ohttpHelpers';
import { BACKEND_URL, OHTTP_RELAY } from "@/config";
import SessionContext from '@/context/SessionContext';
import { toU8 } from '@/util';

// @ts-ignore
const walletBackendServerUrl = BACKEND_URL;
const inFlightRequests = new Map<string, Promise<any>>();
const TIMEOUT = 3 * 1000;

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
	const { obliviousKeyConfig } = useContext(SessionContext);

	const isOnlineRef = useRef(isOnline);

	useEffect(() => {
		isOnlineRef.current = isOnline;
	}, [isOnline]);

	const proxy = useMemo(() => ({
		async get(
			url: string,
			headers: RequestHeaders = {},
			options?: {
				useCache?: boolean;
				cacheOnError?: boolean;
			}
		): Promise<{ status: number; headers: ResponseHeaders; data: unknown }> {
			const useCache = options?.useCache;
			const cacheOnError = options?.cacheOnError ?? false;
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

							if (isBinaryRequest && !cachedData?.__binary) {
								// do nothing -> fall through to fetch
							} else if (isBinaryRequest && cachedData?.__binary) {
								// RECONSTRUCT a fresh Blob URL from the stored bytes and type
								const blob = new Blob([toU8(cachedData.bytes)], { type: cachedData.contentType || 'application/octet-stream' });
								const blobUrl = URL.createObjectURL(blob);

								return {
									status: cachedData.status || 200,
									headers: cachedData.headers || {},
									data: blobUrl,
								};
							} else {
								return cachedData;
							}
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
					let response;
					const shouldUseOblivious = obliviousKeyConfig !== null;
					if (shouldUseOblivious) {
						console.log("Using oblivious");
						const keyConfig = obliviousKeyConfig;
						if (keyConfig === null) {
							throw new Error("Oblivious HTTP configuration error");
						}
						response = await encryptedHttpRequest(OHTTP_RELAY, keyConfig, {
							method: 'GET',
							headers,
							url,
						})
						response.data = response.body;
						if (response.data.status > 299 || response.data.status < 200) {
							const axiosHeaders = AxiosHeaders.from(headers as Record<string, string>);
							throw new AxiosError(
								`Request failed with status code ${response.status}`,
								undefined,
								{
									headers: axiosHeaders,
									method: 'get',
									url,
								},
								undefined,
								{
									data: response,
									status: response.status,
									statusText: String(response.status),
									headers: response.headers || {},
									config: {
										headers: axiosHeaders,
										method: 'get',
										url,
									},
								}
							);
						}
						if (isBinaryRequest) {
							response = {
								...response,
								data: toArrayBuffer(response.body)
							}
						} else {
							response = {
								data: {...response}
							};
							const responseHeader = response?.data?.headers?.['content-type'];
							console.log("Content-Type parsed: ", responseHeader);
							if (responseHeader && responseHeader.trim().startsWith('application/json')) {
								response.data.data = JSON.parse(new TextDecoder().decode(response.data.data));
							} else {
								response.data.data = new TextDecoder().decode(response.data.data);
							}
						}
					} else {
						response = await axios.post(`${walletBackendServerUrl}/proxy`, {
							headers,
							url,
							method: 'GET',
						}, {
							timeout: TIMEOUT,
							headers: {
								Authorization: 'Bearer ' + JSON.parse(sessionStorage.getItem('appToken')!),
							},
							...(isBinaryRequest && { responseType: 'arraybuffer' }),
						}
						);
					}


					const res = response.data;

					const sourceHeaders = isBinaryRequest ? response.headers : response.data?.headers;
					const contentTypeHeader: string | undefined = sourceHeaders?.['content-type'];
					const cacheControlHeader: string | undefined = sourceHeaders?.['cache-control'];

					let shouldCache = useCache !== undefined;
					let maxAge = 60 * 60 * 24 * 30; // default: 30 days

					// Handle Cache-Control logic
					if (shouldCache && typeof cacheControlHeader === 'string') {
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
								data: {
									__binary: true,
									status: response.status,
									headers: sourceHeaders,
									contentType: contentTypeHeader,
									bytes: arrayBuffer,
								},
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

					// Optionally cache failed responses
					if (cacheOnError) {
						await addItem(
							'proxyCache',
							cacheKey,
							{
								data: {
									status: err.response?.status || 500,
									headers: err.response?.headers || {},
									data: err.response?.data || 'GET proxy failed',
									__error: true,
								},
								expiry: now + 60 * 60 * 24 * 30,
							},
							'proxyCache'
						);
					}

					const fallback = await getItem('proxyCache', cacheKey, 'proxyCache');

					if (fallback?.data) {
						return {
							status: 200,
							headers: {},
							data: fallback.data,
						};
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
			let response;
			try {
				const shouldUseOblivious = obliviousKeyConfig !== null;
				if (shouldUseOblivious) {
					console.log("Using oblivious");
					const keyConfig = obliviousKeyConfig;
					if (keyConfig === null) {
						throw new Error("Oblivious HTTP configuration error");
					}
					response = await encryptedHttpRequest(OHTTP_RELAY, keyConfig, {
						method: 'POST',
						headers,
						url,
						body
					})
					response.data = response.body;
					response = {
						data: { ...response }
					};
					if (response.data.status > 299 || response.data.status < 200) {
						const axiosHeaders = AxiosHeaders.from(headers as Record<string, string>);
						throw new AxiosError(
							`Request failed with status code ${response.data.status}`,
							undefined,
							{
								headers: axiosHeaders,
								method: 'post',
								url,
								data: body,
							},
							undefined,
							{
								data: response.data,
								status: response.data.status,
								statusText: String(response.data.status),
								headers: response.data.headers || {},
								config: {
									headers: axiosHeaders,
									method: 'post',
									url,
									data: body,
								},
							}
						);
					}
					const responseHeader = response?.data?.headers?.['content-type'];
					console.log("Content-Type parsed: ", responseHeader);
					if (responseHeader && responseHeader.trim().startsWith('application/json')) {
						response.data.data = JSON.parse(new TextDecoder().decode(response.data.data));
					} else {
						response.data.data = new TextDecoder().decode(response.data.data);
					}
				} else {
					response = await axios.post(`${walletBackendServerUrl}/proxy`, {
						headers: headers,
						url: url,
						method: 'POST',
						data: body,
					}, {
						timeout: TIMEOUT,
						headers: {
							Authorization: 'Bearer ' + JSON.parse(sessionStorage.getItem('appToken'))
						}
					});
				}
				return response.data;
			} catch (err) {
				console.log("Post failed");
				console.log(JSON.stringify(err, Object.getOwnPropertyNames(err)));
				return {
					data: err.response.data.data,
					headers: err.response.data.headers,
					status: err.response.data.status || 500,
				};
			}
		},
	}), [obliviousKeyConfig]);

	return proxy;
}
