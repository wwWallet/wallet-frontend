import axios, { AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

import { requestForToken } from '../firebase';
import { jsonParseTaggedBinary, jsonStringifyTaggedBinary, toBase64Url } from '../util';


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

export function getSession(): { username?: string, displayName?: string } {
	return {
		username: Cookies.get('username'),
		displayName: Cookies.get('displayName'),
	};
}

export function isLoggedIn(): boolean {
	return getSession().username !== undefined;
}

export function clearSession(): void {
	Cookies.remove('username');
	Cookies.remove('displayName');
	Cookies.remove('appToken');
}

export function setSessionCookies(username: string, response: AxiosResponse): void {
	const { appToken, displayName } = response.data;
	Cookies.set('username', username);
	Cookies.set('displayName', displayName);
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

export async function signup(username: string, password: string): Promise<AxiosResponse> {
	const fcm_token = await requestForToken();
	const browser_fcm_token = fcm_token;

	try {
		const response = await post('/user/register', {
			username,
			password,
			fcm_token,
			browser_fcm_token,
			displayName: username,
		});
		setSessionCookies(username, response);

		return response.data;

	} catch (error) {
		console.error('Failed to sign up', error);
		throw error;
	}
};

export async function loginWebauthn(): Promise<AxiosResponse> {
	try {
		const beginResp = await post('/user/login-webauthn-begin', {});
		console.log("begin", beginResp);
		const beginData = beginResp.data;

		try {
			const credential = await navigator.credentials.get(beginData.getOptions) as PublicKeyCredential;
			const response = credential.response as AuthenticatorAssertionResponse;
			console.log("asserted", credential);

			try {
				const finishResp = await post('/user/login-webauthn-finish', {
					challengeId: beginData.challengeId,
					credential: {
						type: credential.type,
						id: credential.id,
						rawId: credential.id,
						response: {
							authenticatorData: toBase64Url(response.authenticatorData),
							clientDataJSON: toBase64Url(response.clientDataJSON),
							signature: toBase64Url(response.signature),
							userHandle: toBase64Url(response.userHandle),
						},
						authenticatorAttachment: credential.authenticatorAttachment,
						clientExtensionResults: credential.getClientExtensionResults(),
					},
				});
				setSessionCookies(finishResp.data.username, finishResp);

				return finishResp;

			} catch (e) {
				throw { errorId: 'passkeyInvalid' };
			}

		} catch (e) {
			throw { errorId: 'passkeyLoginFailedTryAgain' };
		}

	} catch (e) {
		throw { errorId: 'passkeyLoginFailedServerError' };
	}
};

export async function signupWebauthn(name: string): Promise<AxiosResponse> {
	try {
		const beginResp = await post('/user/register-webauthn-begin', {});
		console.log("begin", beginResp);
		const beginData = beginResp.data;

		try {
			const credential = await navigator.credentials.create({
				...beginData.createOptions,
				publicKey: {
					...beginData.createOptions.publicKey,
					user: {
						...beginData.createOptions.publicKey.user,
						name,
						displayName: name,
					},
				},
			}) as PublicKeyCredential;
			const response = credential.response as AuthenticatorAttestationResponse;
			console.log("created", credential);

			try {
				const finishResp = await post('/user/register-webauthn-finish', {
					challengeId: beginData.challengeId,
					displayName: name,
					credential: {
						type: credential.type,
						id: credential.id,
						rawId: credential.id,
						response: {
							attestationObject: toBase64Url(response.attestationObject),
							clientDataJSON: toBase64Url(response.clientDataJSON),
							transports: response.getTransports(),
						},
						authenticatorAttachment: credential.authenticatorAttachment,
						clientExtensionResults: credential.getClientExtensionResults(),
					},
				});
				setSessionCookies(null, finishResp);

				return finishResp;
			} catch (e) {
				throw { errorId: 'passkeySignupFailedServerError' };
			}

		} catch (e) {
			throw { errorId: 'passkeySignupFailedTryAgain' };
		}

	} catch (e) {
		throw { errorId: 'passkeySignupFinishFailedServerError' };
	}
}
