import axios, { AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

import { jsonParseTaggedBinary, jsonStringifyTaggedBinary } from '../util';


const walletBackendUrl = process.env.REACT_APP_WALLET_BACKEND_URL;

function getAppToken(): string | undefined {
	return Cookies.get('appToken');
}

function transformResponse(data: any): any {
	if (data) {
		return jsonParseTaggedBinary(data);
	} else {
		return data;
	}
}

export async function get(path: string): Promise<AxiosResponse> {
	return await axios.get(
		`${walletBackendUrl}${path}`,
		{
			headers: {
				Authorization: `Bearer ${getAppToken()}`,
			},
			transformResponse,
		},
	);
}

export async function post(path: string, body: object): Promise<AxiosResponse> {
	return await axios.post(
		`${walletBackendUrl}${path}`,
		body,
		{
			headers: {
				Authorization: `Bearer ${getAppToken()}`,
				'Content-Type': 'application/json',
			},
			transformRequest: (data, headers) => jsonStringifyTaggedBinary(data),
			transformResponse,
		},
	);
}

export async function del(path: string): Promise<AxiosResponse> {
	return await axios.delete(
		`${walletBackendUrl}${path}`,
		{
			headers: {
				Authorization: `Bearer ${getAppToken()}`,
			},
			transformResponse,
		});
}

export function getSession(): { did?: string, displayName?: string } {
	return {
		displayName: Cookies.get('displayName'),
		did: Cookies.get('did'),
	};
}

export function isLoggedIn(): boolean {
	return getSession().did !== undefined;
}

export function clearSession(): void {
	Cookies.remove('did');
	Cookies.remove('displayName');
	Cookies.remove('appToken');
}

export function setSessionCookies(response: AxiosResponse): void {
	const { appToken, did, displayName } = response.data;
	Cookies.set('did', did);
	Cookies.set('displayName', displayName);
	Cookies.set('appToken', appToken);
}
