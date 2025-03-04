import { useMemo, useRef } from 'react';
import axios from 'axios';
import { IHttpProxy } from '../../interfaces/IHttpProxy';

// @ts-ignore
const walletBackendServerUrl = import.meta.env.VITE_WALLET_BACKEND_URL;

export function useHttpProxy(): IHttpProxy {
	const cachedResponses = useRef<Map<string, { status: number, headers: Record<string, unknown>, data: unknown }>>(new Map());

	const proxy = useMemo(() => ({
		async get(url: string, headers: any): Promise<{ status: number, headers: Record<string, unknown>, data: unknown }> {
			try {
				if ((url.endsWith(".svg") || url.endsWith(".png")) && cachedResponses.current.get(url)) {
					return cachedResponses.current.get(url);
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
				cachedResponses.current.set(url, response.data as { status: number, headers: Record<string, unknown>, data: unknown });
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
