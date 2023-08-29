import axios, { AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

import { requestForToken } from '../firebase';
import { jsonParseTaggedBinary, jsonStringifyTaggedBinary } from '../util';
import { WalletKey } from '@gunet/ssi-sdk';


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

export function getSession(): { username?: string } {
	return {
		username: Cookies.get('username'),
	};
}

export function isLoggedIn(): boolean {
	return getSession().username !== undefined;
}

export function clearSession(): void {
	Cookies.remove('username');
	Cookies.remove('appToken');
}

function setSessionCookies(username: string, response: AxiosResponse): void {
	const { appToken } = response.data;
	Cookies.set('username', username);
	Cookies.set('appToken', appToken);
}

export async function login(username: string, password: string): Promise<AxiosResponse> {
	try {
		const response = await post('/user/login', { username, password });
		setSessionCookies(username, response);

		return response.data;

	} catch (error) {
		console.error('Failed to log in', error);
		throw error;
	}
};

export async function signup(username: string, password: string, keys: WalletKey, pbkdf2Params: string, privateData: string): Promise<AxiosResponse> {
	const fcm_token = await requestForToken();
	const browser_fcm_token = fcm_token;

	try {
		const response = await post('/user/register', {
			username,
			password,
			fcm_token,
			browser_fcm_token,
			keys,
			pbkdf2Params,
			privateData,
		});
		setSessionCookies(username, response);

		return response.data;

	} catch (error) {
		console.error('Failed to sign up', error);
		throw error;
	}
};
