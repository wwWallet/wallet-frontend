import { BACKEND_URL } from '../../config';
import { appTokenAuthorizationHeader } from './authorization';

const API_BASE_URL = `${BACKEND_URL}/proxy`;

export interface ProxyResponseData {
	data: any;
}

interface ProxyResponseError {
	err: {
		data: any;
		headers: any;
		status: number;
	}
}

export const get = async (url: string, headers: any): Promise<ProxyResponseData> => {
	try {
		const response = await fetch(API_BASE_URL, {
			body: JSON.stringify({
				headers: headers,
				url: url,
				method: 'get',
			}),
			headers: {
				Authorization: appTokenAuthorizationHeader(),
			},
			signal: AbortSignal.timeout(2500),
		});

		const { data } = await response.json();

		return data;
	}
	catch(err) {
		return null;
	}
}

export const post = async (url: string, body: any, headers: any): Promise<ProxyResponseData | ProxyResponseError> => {
	try {
		const response = await fetch(API_BASE_URL, {
			body: JSON.stringify({
				headers: headers,
				url: url,
				method: 'post',
				data: body,
			}),
			headers: {
				Authorization: appTokenAuthorizationHeader(),
			},
			signal: AbortSignal.timeout(2500),
		});

		const { data } = await response.json();

		return data;
	}
	catch(err) {
		return {
			err: {
				data: err.response.data.err.data,
				headers: err.response.data.err.headers,
				status: err.response.status
			}
		}
	}
}

const ProxyClient = {
	get,
	post,
};

export default ProxyClient;
