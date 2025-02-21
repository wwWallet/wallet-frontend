import { useMemo } from 'react';
import axios from 'axios';
import { IHttpProxy } from '../../interfaces/IHttpProxy';

// @ts-ignore
const walletBackendServerUrl = import.meta.env.VITE_WALLET_BACKEND_URL;

export function useHttpProxy(): IHttpProxy {
	const proxy = useMemo(() => ({
		async get(url: string, headers: any): Promise<{ status: number, headers: Record<string, unknown>, data: unknown }> {
			try {
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
				return response.data;
			}
			catch (err) {
				return {
					data: err.response.data.err.data,
					headers: err.response.data.err.headers,
					status: err.response.status
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
					data: err.response.data.err.data,
					headers: err.response.data.err.headers,
					status: err.response.status
				}
			}
		}
	}), []);

	return proxy;
}
