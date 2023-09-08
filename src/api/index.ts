import axios, { AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

import { requestForToken } from '../firebase';
import { jsonParseTaggedBinary, jsonStringifyTaggedBinary } from '../util';
import { LocalStorageKeystore } from '../services/LocalStorageKeystore';


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

export async function login(username: string, password: string, keystore: LocalStorageKeystore): Promise<void> {
	try {
		const response = await post('/user/login', { username, password });
		setSessionCookies(username, response);

		const userData = response.data;
		const privateData = jsonParseTaggedBinary(userData.privateData);
		try {
			await keystore.unlockPassword(privateData, password, privateData.passwordKey);
		} catch (e) {
			console.error("Failed to unlock local keystore", e);
			throw e;
		}

	} catch (error) {
		console.error('Failed to log in', error);
		throw error;
	}
};

export async function signup(username: string, password: string, keystore: LocalStorageKeystore): Promise<void> {
	const fcm_token = await requestForToken();
	const browser_fcm_token = fcm_token;

	try {
		const { publicData, privateData } = await keystore.initPassword(password);

		try {
			const response = await post('/user/register', {
				username,
				password,
				fcm_token,
				browser_fcm_token,
				keys: publicData,
				privateData: jsonStringifyTaggedBinary(privateData),
			});
			setSessionCookies(username, response);

		} catch (e) {
			console.error("Signup failed", e);
			throw e;
		}

	} catch (e) {
		console.error("Failed to initialize local keystore", e);
		throw e;
	}
};
