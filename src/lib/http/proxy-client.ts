import axios from 'axios';
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
		const response = await axios.post(API_BASE_URL, {
			headers: headers,
			url: url,
			method: 'get',
		}, {
			timeout: 2500,
			headers: {
				Authorization: appTokenAuthorizationHeader()
			}
		});
		return response.data;
	}
	catch(err) {
		return null;
	}
}

export const post = async (url: string, body: any, headers: any): Promise<ProxyResponseData | ProxyResponseError> => {
	try {
		const response = await axios.post(API_BASE_URL, {
			headers: headers,
			url: url,
			method: 'post',
			data: body,
		}, {
			timeout: 2500,
			headers: {
				Authorization: appTokenAuthorizationHeader(),
			}
		});
		return response.data;
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
