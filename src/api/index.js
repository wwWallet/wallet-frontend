import axios from 'axios';
import Cookies from 'js-cookie';

import { requestForToken } from '../firebase';


const walletBackendUrl = process.env.REACT_APP_WALLET_BACKEND_URL;

function getAppToken() {
	return Cookies.get('appToken');
}

export async function get(path) {
	return await axios.get(
		`${walletBackendUrl}${path}`,
		{
			headers: {
				Authorization: `Bearer ${getAppToken()}`,
			},
		});
}

export async function post(path, body) {
	return await axios.post(
		`${walletBackendUrl}${path}`,
		body,
		{
			headers: {
				Authorization: `Bearer ${getAppToken()}`,
				'Content-Type': 'application/json',
			},
		},
	);
}

export function getSession() {
	return {
		username: Cookies.get('username'),
	};
}

export function isLoggedIn() {
	return getSession().username !== undefined;
}

export function clearSession() {
	Cookies.remove('username');
	Cookies.remove('appToken');
}

function setSessionCookies(username, response) {
	const { appToken } = response.data;
	Cookies.set('username', username);
	Cookies.set('appToken', appToken);
}

export async function login(username, password) {
	try {
		const response = await post('/user/login', { username, password });
		setSessionCookies(username, response);

		return response.data;

	} catch (error) {
		console.error('Failed to log in', error);
		throw error;
	}
};

export async function signup(username, password) {
	const fcm_token = await requestForToken();
	const browser_fcm_token = fcm_token;

	try {
		const response = await post('/user/register', {
			username,
			password,
			fcm_token,
			browser_fcm_token,
		});
		setSessionCookies(username, response);

		return response.data;

	} catch (error) {
		console.error('Failed to sign up', error);
		throw error;
	}
};
