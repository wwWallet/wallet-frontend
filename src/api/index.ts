import axios, { AxiosResponse } from 'axios';
import { Err, Ok, Result } from 'ts-results';

import * as config from '../config';
import { fromBase64Url, jsonParseTaggedBinary, jsonStringifyTaggedBinary, toBase64Url } from '../util';
import { EncryptedContainer, makeAssertionPrfExtensionInputs, parsePrivateData, serializePrivateData } from '../services/keystore';
import { CachedUser, LocalStorageKeystore } from '../services/LocalStorageKeystore';
import { UserData, UserId, Verifier } from './types';
import { useEffect } from 'react';
import { UseStorageHandle, useClearStorages, useLocalStorage, useSessionStorage } from '../hooks/useStorage';
import { addItem, getItem } from '../indexedDB';
import { loginWebAuthnBeginOffline } from './LocalAuthentication';
import { makeCreateOptions } from '../functions/webauthn';
import * as uuid from 'uuid';

const walletBackendUrl = config.BACKEND_URL;

type SessionState = {
	uuid: string;
	username: string,
	displayName: string,
	webauthnCredentialCredentialId: string,
	authenticationType: 'signup' | 'login',
	showWelcome: boolean,
}

type SignupWebauthnError = (
	'passkeySignupFailedServerError'
	| 'passkeySignupFailedTryAgain'
	| 'passkeySignupFinishFailedServerError'
	| 'passkeySignupKeystoreFailed'
	| 'passkeySignupPrfNotSupported'
	| { errorId: 'prfRetryFailed', retryFrom: SignupWebauthnRetryParams }
);
type SignupWebauthnRetryParams = { beginData: any, credential: PublicKeyCredential };

interface User {
	appToken: string;
	uuid: string;
	displayName: string;
	username: string;
}

export type ClearSessionEvent = {};
export const CLEAR_SESSION_EVENT = 'clearSession';
export type ApiEventType = typeof CLEAR_SESSION_EVENT;
const events: EventTarget = new EventTarget();

export interface BackendApi {
	del(path: string): Promise<AxiosResponse>,
	get(path: string): Promise<AxiosResponse>,
	getExternalEntity(path: string): Promise<AxiosResponse>,
	post(path: string, body: object): Promise<AxiosResponse>,

	getSession(): SessionState,
	isLoggedIn(): boolean,
	getAppToken(): string | undefined,
	clearSession(): void,
	getAppToken(): string | null,

	login(username: string, password: string, keystore: LocalStorageKeystore): Promise<Result<void, any>>,
	signup(username: string, password: string, keystore: LocalStorageKeystore): Promise<Result<void, any>>,
	getAllVerifiers(): Promise<Verifier[]>,
	getAllPresentations(): Promise<{ vp_list: any[] }>,
	initiatePresentationExchange(verifier_id: number, scope_name: string): Promise<{ redirect_to?: string }>,

	loginWebauthn(
		keystore: LocalStorageKeystore,
		promptForPrfRetry: () => Promise<boolean | AbortSignal>,
		cachedUser: CachedUser | undefined,
	): Promise<
		Result<void, 'loginKeystoreFailed' | 'passkeyInvalid' | 'passkeyLoginFailedTryAgain' | 'passkeyLoginFailedServerError' | 'x-private-data-etag'>
	>,
	signupWebauthn(
		name: string,
		keystore: LocalStorageKeystore,
		promptForPrfRetry: () => Promise<boolean | AbortSignal>,
		retryFrom?: SignupWebauthnRetryParams,
	): Promise<Result<void, SignupWebauthnError>>,
	updatePrivateData(newPrivateData: EncryptedContainer): Promise<void>,
	updatePrivateDataEtag(resp: AxiosResponse): AxiosResponse,

	updateShowWelcome(showWelcome: boolean): void,

	addEventListener(type: ApiEventType, listener: EventListener, options?: boolean | AddEventListenerOptions): void,
	removeEventListener(type: ApiEventType, listener: EventListener, options?: boolean | EventListenerOptions): void,
	/** Register a storage hook handle to be cleared when `useApi().clearSession()` is invoked. */
	useClearOnClearSession<T>(storageHandle: UseStorageHandle<T>): UseStorageHandle<T>,
}

export function useApi(isOnline: boolean = true, isStandAlone: boolean = false): BackendApi {
	const [appToken, setAppToken, clearAppToken] = useSessionStorage<string | null>("appToken", null);
	const [sessionState, setSessionState, clearSessionState] = useSessionStorage<SessionState | null>("sessionState", null);
	const clearSessionStorage = useClearStorages(clearAppToken, clearSessionState);

	/**
	 * Synchronization tag for the encrypted private data. To prevent data loss,
	 * this MUST be refreshed only when a new version of the private data is
	 * loaded into the keystore or successfully uploaded to the server.
	 */
	const [privateDataEtag, setPrivateDataEtag] = useLocalStorage<string | null>("privateDataEtag", null);

	function getAppToken(): string | null {
		return appToken;
	}

	function transformResponse(data: any): any {
		if (data) {
			return jsonParseTaggedBinary(data);
		} else {
			return data;
		}
	}

	function updatePrivateDataEtag(resp: AxiosResponse): AxiosResponse {
		const newValue = resp.headers['x-private-data-etag']
		if (newValue) {
			setPrivateDataEtag(newValue);
		}
		return resp;
	}

	function buildGetHeaders(headers: { appToken?: string }): { [header: string]: string } {
		const authz = headers?.appToken || appToken;
		return {
			...(authz ? { Authorization: `Bearer ${authz}` } : {}),
		};
	}

	function buildMutationHeaders(headers: { appToken?: string }): { [header: string]: string } {
		return {
			...buildGetHeaders(headers),
			...(privateDataEtag ? { 'X-Private-Data-If-Match': privateDataEtag } : {}),
		};
	}

	async function getWithLocalDbKey(path: string, dbKey: string, options?: { appToken?: string }): Promise<AxiosResponse> {
		// console.log(`Get: ${path} ${isOnline ? 'online' : 'offline'} mode ${isOnline}`);

		// Offline case
		if (!isOnline || isStandAlone) {
			return {
				data: await getItem(path, dbKey),
			} as AxiosResponse;
		}

		// Online case
		const respBackend = await axios.get(
			`${walletBackendUrl}${path}`,
			{
				headers: buildGetHeaders({ appToken: options?.appToken }),
				transformResponse,
			},
		);
		await addItem(path, dbKey, respBackend.data);
		return respBackend;
	}

	async function get(path: string, userUuid?: string, options?: { appToken?: string }): Promise<AxiosResponse> {
		return getWithLocalDbKey(path, sessionState?.uuid || userUuid, options);
	}

	async function getExternalEntity(path: string, options?: { appToken?: string }): Promise<AxiosResponse> {
		return getWithLocalDbKey(path, path, options);
	}

	async function fetchInitialData(appToken: string, userUuid: string): Promise<void> {
		try {
			await get('/storage/vc', userUuid, { appToken });
			await get('/storage/vp', userUuid, { appToken });
			await get('/user/session/account-info', userUuid, { appToken });
			await getExternalEntity('/issuer/all', { appToken });
			await getExternalEntity('/verifier/all', { appToken });

		} catch (error) {
			console.error('Failed to perform get requests', error);
		}
	}

	async function post(path: string, body: object, options?: { appToken?: string }): Promise<AxiosResponse> {
		try {
			return await axios.post(
				`${walletBackendUrl}${path}`,
				body,
				{
					headers: {
						'Content-Type': 'application/json',
						...buildMutationHeaders({ appToken: options?.appToken }),
					},
					transformRequest: (data, headers) => jsonStringifyTaggedBinary(data),
					transformResponse,
				},
			);
		} catch (e) {
			if (e?.response?.status === 412 && (e?.response?.headers ?? {})['x-private-data-etag']) {
				return Promise.reject({ cause: 'x-private-data-etag' });
			}
			throw e;
		}
	}

	async function del(path: string, options?: { appToken?: string }): Promise<AxiosResponse> {
		try {
			return await axios.delete(
				`${walletBackendUrl}${path}`,
				{
					headers: buildMutationHeaders({ appToken: options?.appToken }),
					transformResponse,
				});
		} catch (e) {
			if (e?.response?.status === 412 && (e?.response?.headers ?? {})['x-private-data-etag']) {
				return Promise.reject({ cause: 'x-private-data-etag' });
			}
			throw e;
		}
	}

	function updateShowWelcome(showWelcome: boolean): void {
		if (sessionState) {
			setSessionState((prevState) => ({
				...prevState,
				showWelcome: showWelcome,
			}));
		}
	}

	function getSession(): SessionState {
		return sessionState;
	}

	function isLoggedIn(): boolean {
		return getSession() !== null;
	}

	function clearSession(): void {
		clearSessionStorage();
		events.dispatchEvent(new CustomEvent<ClearSessionEvent>(CLEAR_SESSION_EVENT));
	}

	async function setSession(
		user: User,
		credential: PublicKeyCredential | null,
		authenticationType: 'signup' | 'login',
	): Promise<void> {
		setAppToken(user.appToken);
		setSessionState({
			uuid: user.uuid,
			displayName: user.displayName,
			username: user.username,
			webauthnCredentialCredentialId: credential?.id,
			authenticationType,
			showWelcome: authenticationType === 'signup',
		});

		await addItem('users', user.uuid, user);
		if (isOnline && !isStandAlone) {
			await fetchInitialData(user.appToken, user.uuid).catch((error) => console.error('Error in performGetRequests', error));
		}
	}

	async function login(username: string, password: string, keystore: LocalStorageKeystore): Promise<Result<void, any>> {
		try {
			const response = updatePrivateDataEtag(await post('/user/login', { username, password }));
			const userData = response.data as UserData;
			const privateData = await parsePrivateData(userData.privateData);
			try {
				const privateDataUpdate = await keystore.unlockPassword(privateData, password, { displayName: userData.displayName, userHandle: UserId.fromId(userData.uuid).asUserHandle() });
				if (privateDataUpdate) {
					const [newPrivateData, keystoreCommit] = privateDataUpdate;
					try {
						await updatePrivateData(newPrivateData, { appToken: response.data.appToken });
						await keystoreCommit();
					} catch (e) {
						console.error("Failed to upgrade password key", e, e.status);
						if (e?.cause === 'x-private-data-etag') {
							return Err('x-private-data-etag');
						}
						return Err('loginKeystoreFailed');
					}
				}
				await setSession(response.data, null, 'login');
				return Ok.EMPTY;
			} catch (e) {
				console.error("Failed to unlock local keystore", e);
				return Err(e);
			}

		} catch (error) {
			console.error('Failed to log in', error);
			return Err(error);
		}
	};

	async function signup(username: string, password: string, keystore: LocalStorageKeystore): Promise<Result<void, any>> {

		try {
			const [privateData, setUserHandleB64u] = await keystore.initPassword(password);

			try {
				const response = updatePrivateDataEtag(await post('/user/register', {
					username,
					password,
					displayName: username,
					privateData: serializePrivateData(privateData),
				}));
				const userData = response.data as UserData;
				setUserHandleB64u(toBase64Url(UserId.fromId(userData.uuid).asUserHandle()));
				await setSession(response.data, null, 'signup');
				return Ok.EMPTY;

			} catch (e) {
				console.error("Signup failed", e);
				return Err(e);
			}

		} catch (e) {
			console.error("Failed to initialize local keystore", e);
			return Err(e);
		}
	}

	async function updatePrivateData(newPrivateData: EncryptedContainer, options?: { appToken?: string }): Promise<void> {
		try {
			const updateResp = updatePrivateDataEtag(
				await post('/user/session/private-data', serializePrivateData(newPrivateData), options),
			);
			if (updateResp.status === 204) {
				return;
			} else {
				console.error("Failed to update private data", updateResp.status, updateResp);
				return Promise.reject(updateResp);
			}
		} catch (e) {
			console.error("Failed to update private data", e, e?.response?.status);
			if (e?.response?.status === 412 && (e?.headers ?? {})['x-private-data-etag']) {
				throw new Error("Private data version conflict", { cause: 'x-private-data-etag' });
			}
			throw e;
		}
	}

	async function getAllVerifiers(): Promise<Verifier[]> {
		try {
			const result = await getExternalEntity('/verifier/all');
			const verifiers = result.data;
			console.log("verifiers = ", verifiers)
			return verifiers;
		}
		catch (error) {
			console.error("Failed to fetch all verifiers", error);
			throw error;
		}
	}

	async function getAllPresentations(): Promise<{ vp_list: any[] }> {
		try {
			const result = await get('/storage/vp');
			return result.data; // Return the Axios response.
		}
		catch (error) {
			console.error("Failed to fetch all presentations", error);
			throw error;
		}
	}

	async function initiatePresentationExchange(verifier_id: number, scope_name: string): Promise<{ redirect_to?: string }> {
		try {
			const result = await post('/presentation/initiate', { verifier_id, scope_name });
			const { redirect_to } = result.data;
			return { redirect_to };
		}
		catch (error) {
			console.error("Failed to fetch all verifiers", error);
			throw error;
		}
	}

	async function loginWebauthn(
		keystore: LocalStorageKeystore,
		promptForPrfRetry: () => Promise<boolean | AbortSignal>,
		cachedUser: CachedUser | undefined,
	): Promise<
		Result<void, 'loginKeystoreFailed' | 'passkeyInvalid' | 'passkeyLoginFailedTryAgain' | 'passkeyLoginFailedServerError' | 'x-private-data-etag'>
	> {
		try {
			const beginData = await (async (): Promise<{
				challengeId?: string,
				getOptions: { publicKey: PublicKeyCredentialRequestOptions },
			}> => {
				if (isOnline && !isStandAlone) {
					const beginResp = await post('/user/login-webauthn-begin', {});
					console.log("begin", beginResp);
					return beginResp.data;
				}
				else {
					return loginWebAuthnBeginOffline();
				}
			})();

			try {
				const prfInputs = cachedUser && makeAssertionPrfExtensionInputs(cachedUser.prfKeys);
				const getOptions = prfInputs
					? {
						...beginData.getOptions,
						publicKey: {
							...beginData.getOptions.publicKey,
							allowCredentials: prfInputs.allowCredentials,
							extensions: {
								...beginData.getOptions.publicKey.extensions,
								prf: prfInputs.prfInput,
							},
						},
					}
					: beginData.getOptions;
				const credential = await navigator.credentials.get(getOptions) as PublicKeyCredential;
				const response = credential.response as AuthenticatorAssertionResponse;

				try {
					const finishResp = await (async () => {
						if (isOnline && !isStandAlone) {
							return updatePrivateDataEtag(await post('/user/login-webauthn-finish', {
								challengeId: beginData.challengeId,
								credential: {
									type: credential.type,
									id: credential.id,
									rawId: credential.rawId,
									response: {
										authenticatorData: response.authenticatorData,
										clientDataJSON: response.clientDataJSON,
										signature: response.signature,
										userHandle: response.userHandle ?? fromBase64Url(cachedUser?.userHandleB64u),
									},
									authenticatorAttachment: credential.authenticatorAttachment,
									clientExtensionResults: credential.getClientExtensionResults(),
								},
							}));
						}
						else {
							const userId = UserId.fromUserHandle(response.userHandle);
							const user = await getItem("users", userId.id);
							return {
								data: {
									uuid: user.uuid,
									appToken: "",
									did: user.did,
									displayName: user.displayName,
									privateData: user.privateData,
									username: user.username,
								},
							};
						}
					})() as any;

					if (isStandAlone) {
						await setSession(finishResp.data, credential, 'login');
						return Ok.EMPTY;
					}

					try {
						const userData = finishResp.data as UserData;
						const privateData = await parsePrivateData(userData.privateData);
						const privateDataUpdate = await keystore.unlockPrf(
							privateData,
							credential,
							promptForPrfRetry,
							cachedUser || {
								...userData,
								// response.userHandle will always be non-null if cachedUser is
								// null, because then allowCredentials was empty
								userHandle: new Uint8Array(response.userHandle),
							},
						);
						if (privateDataUpdate) {
							const [newPrivateData, keystoreCommit] = privateDataUpdate;
							try {
								await updatePrivateData(newPrivateData, { appToken: finishResp.data.appToken });
								await keystoreCommit();
							} catch (e) {
								console.error("Failed to upgrade PRF key", e, e.status);
								if (e?.cause === 'x-private-data-etag') {
									return Err('x-private-data-etag');
								}
								return Err('loginKeystoreFailed');
							}
						}
						await setSession(finishResp.data, credential, 'login');
						return Ok.EMPTY;
					} catch (e) {
						console.error("Failed to open keystore", e);
						return Err('loginKeystoreFailed');
					}

				} catch (e) {
					return Err('passkeyInvalid');
				}

			} catch (e) {
				return Err('passkeyLoginFailedTryAgain');
			}

		} catch (e) {
			return Err('passkeyLoginFailedServerError');
		}
	};

	const fetchWebAuthnBeginData = async () => {
		if (isStandAlone) {
			return {
				createOptions: makeCreateOptions({
					challenge: window.crypto.getRandomValues(new Uint8Array(32)),
					user: {
						uuid: UserId.fromId(uuid.v4()),
						name: '',
						displayName: '',
					}
				})
			};
		}

		return (await post('/user/register-webauthn-begin', {})).data
	}

	async function signupWebauthn(
		name: string,
		keystore: LocalStorageKeystore,
		promptForPrfRetry: () => Promise<boolean | AbortSignal>,
		retryFrom?: SignupWebauthnRetryParams,
	): Promise<Result<void, SignupWebauthnError>> {
		try {
			const beginData = retryFrom?.beginData || await fetchWebAuthnBeginData();
			console.log("begin", beginData);

			try {
				const prfSalt = crypto.getRandomValues(new Uint8Array(32))
				const credential = retryFrom?.credential || await navigator.credentials.create({
					...beginData.createOptions,
					publicKey: {
						...beginData.createOptions.publicKey,
						user: {
							...beginData.createOptions.publicKey.user,
							name,
							displayName: name,
						},
						extensions: {
							prf: {
								eval: {
									first: prfSalt,
								},
							},
						},
					},
				}) as PublicKeyCredential;
				const response = credential.response as AuthenticatorAttestationResponse;
				console.log("created", credential);

				try {
					const privateData = await keystore.initPrf(
						credential,
						prfSalt,
						promptForPrfRetry,
						{ displayName: name, userHandle: beginData.createOptions.publicKey.user.id },
					);

					try {
						const finishResp = isStandAlone
							? undefined
							: updatePrivateDataEtag(await post('/user/register-webauthn-finish', {
								challengeId: beginData.challengeId,
								displayName: name,
								privateData: serializePrivateData(privateData),
								credential: {
									type: credential.type,
									id: credential.id,
									rawId: credential.rawId,
									response: {
										attestationObject: response.attestationObject,
										clientDataJSON: response.clientDataJSON,
										transports: response.getTransports(),
									},
									authenticatorAttachment: credential.authenticatorAttachment,
									clientExtensionResults: credential.getClientExtensionResults(),
								},
							}));
						await setSession(finishResp?.data || {
							appToken: '',
							uuid: String.fromCodePoint(...beginData.createOptions.publicKey.user.id),
							displayName: name,
							username: name
						}, credential, 'signup');
						return Ok.EMPTY;

					} catch (e) {
						return Err('passkeySignupFailedServerError');
					}

				} catch (e) {
					if (e?.cause?.errorId === "prf_retry_failed") {
						return Err({ errorId: 'prfRetryFailed', retryFrom: { credential, beginData } });
					} else if (e?.cause?.errorId === "prf_not_supported") {
						return Err('passkeySignupPrfNotSupported');
					} else {
						return Err('passkeySignupKeystoreFailed');
					}
				}

			} catch (e) {
				return Err('passkeySignupFailedTryAgain');
			}

		} catch (e) {
			return Err('passkeySignupFinishFailedServerError');
		}
	}

	function addEventListener(type: ApiEventType, listener: EventListener, options?: boolean | AddEventListenerOptions): void {
		events.addEventListener(type, listener, options);
	}

	function removeEventListener(type: ApiEventType, listener: EventListener, options?: boolean | EventListenerOptions): void {
		events.removeEventListener(type, listener, options);
	}

	function useClearOnClearSession<T>(storageHandle: UseStorageHandle<T>): UseStorageHandle<T> {
		const [, , clearHandle] = storageHandle;
		useEffect(
			() => {
				const listener = () => { clearHandle(); };
				addEventListener(CLEAR_SESSION_EVENT, listener);
				return () => {
					removeEventListener(CLEAR_SESSION_EVENT, listener);
				};
			},
			[clearHandle]
		);
		return storageHandle;
	}

	return {
		del,
		get,
		getExternalEntity,
		post,

		updateShowWelcome,

		getSession,
		isLoggedIn,
		clearSession,

		login,
		signup,
		getAllVerifiers,
		getAllPresentations,
		getAppToken,
		initiatePresentationExchange,

		loginWebauthn,
		signupWebauthn,
		updatePrivateData,
		updatePrivateDataEtag,

		addEventListener,
		removeEventListener,
		useClearOnClearSession,
	};
}
