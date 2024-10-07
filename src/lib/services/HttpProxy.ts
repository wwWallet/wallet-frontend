import axios from 'axios';
import { IHttpProxy } from '../interfaces/IHttpProxy';

// @ts-ignore
const walletBackendServerUrl = process.env.REACT_APP_WALLET_BACKEND_URL;

export class HttpProxy implements IHttpProxy {
	async get(url: string, headers: any): Promise<any> {
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
		catch(err) {
			return null;
		}

	}

	async post(url: string, body: any, headers: any): Promise<any> {
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
		catch(err) {
			return null;
		}
	}
}
