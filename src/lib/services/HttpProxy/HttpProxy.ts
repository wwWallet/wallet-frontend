import { useMemo, useRef } from 'react';
import axios from 'axios';
import { IHttpProxy } from '../../interfaces/IHttpProxy';

// @ts-ignore
const walletBackendServerUrl = import.meta.env.VITE_WALLET_BACKEND_URL;

const parseCacheControl = (header: string) => Object.fromEntries(
	header.split(',').map(d => d
		.trim()
		.split('=')
		.map((v, i) => i === 0 ? v : Number(v) || v)
	)
);

export function useHttpProxy(): IHttpProxy {
	const cachedResponses = useRef<Map<string, { status: number, headers: Record<string, unknown>, data: unknown }>>(new Map());

	const cachedResponsesTimestamp = useRef<Map<string, number>>(new Map());

	const proxy = useMemo(() => ({
		async get(url: string, headers: any): Promise<{ status: number, headers: Record<string, unknown>, data: unknown }> {
			try {
				if ((url.endsWith(".svg") || url.endsWith(".png")) && cachedResponses.current.get(url)) {
					return cachedResponses.current.get(url);
				}
				else if (cachedResponses.current.get(url) && cachedResponsesTimestamp.current.get(url)) {
					const r = cachedResponses.current.get(url);
					const cacheControl = r.headers["cache-control"] && typeof r.headers["cache-control"] === 'string' ?
						parseCacheControl(r.headers["cache-control"]) :
						null;
					if (cacheControl && cacheControl['max-age'] && typeof cacheControl['max-age'] === 'number') {
						const maxAge = cacheControl['max-age'];
						if (Math.floor(new Date().getTime() / 1000) + maxAge > cachedResponsesTimestamp.current.get(url)) {
							return cachedResponses.current.get(url);
						}
					}
				}
				const response = await axios.post(`${walletBackendServerUrl}/proxy`, {
					headers: headers,
					url: url,
					method: 'get',
				}, {
					timeout: 2500,
					headers: {
						Authorization: 'Bearer ' + JSON.parse(sessionStorage.getItem('appToken'))
					}
				});
				if (url.endsWith(".svg") || url.endsWith(".png")) {
					cachedResponses.current.set(url, response.data as { status: number, headers: Record<string, unknown>, data: unknown });
					cachedResponsesTimestamp.current.set(url, Math.floor(new Date().getTime() / 1000))
				}
				else if (response.data.headers["cache-control"] && typeof response.data.headers["cache-control"] === 'string') {
					cachedResponses.current.set(url, response.data as { status: number, headers: Record<string, unknown>, data: unknown });
					cachedResponsesTimestamp.current.set(url, Math.floor(new Date().getTime() / 1000));
				}
				return response.data;
			}
			catch (err) {
				return {
					data: err.response.data.data,
					headers: err.response.data.headers,
					status: err.response.data.status
				}
			}

		},

		async post(url: string, body: any, headers: any): Promise<{ status: number, headers: Record<string, unknown>, data: unknown }> {
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
			}
			catch (err) {
				return {
					data: err.response.data.data,
					headers: err.response.data.headers,
					status: err.response.data.status
				}
			}
		}
	}), []);

	return proxy;
}
