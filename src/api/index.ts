import axios, { AxiosResponse } from 'axios';
import { Err, Ok, Result } from 'ts-results';

import * as config from '../config';
import { fromBase64Url, jsonParseTaggedBinary, jsonStringifyTaggedBinary, toBase64Url } from '../util';
import { EncryptedContainer, makeAssertionPrfExtensionInputs, parsePrivateData, serializePrivateData } from '../services/keystore';
import { CachedUser, LocalStorageKeystore } from '../services/LocalStorageKeystore';
import { UserData, UserId, Verifier } from './types';
import { useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UseStorageHandle, useClearStorages, useLocalStorage, useSessionStorage } from '../hooks/useStorage';
import { addItem, getItem, EXCLUDED_INDEXEDDB_PATHS } from '../indexedDB';
import { loginWebAuthnBeginOffline } from './LocalAuthentication';
import { withAuthenticatorAttachmentFromHints, withHintsFromAllowCredentials } from '@/util-webauthn';

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


export type ClearSessionEvent = {};
export const CLEAR_SESSION_EVENT = 'clearSession';
export type ApiEventType = typeof CLEAR_SESSION_EVENT;
const events: EventTarget = new EventTarget();


export interface BackendApi {
	del(path: string): Promise<AxiosResponse>,
	get(path: string): Promise<AxiosResponse>,
	getExternalEntity(path: string, options?: { appToken?: string }, forceIndexDB?: boolean): Promise<AxiosResponse>,
	post(path: string, body: object): Promise<AxiosResponse>,

	getSession(): SessionState,
	isLoggedIn(): boolean,
	// getAppToken(): string | undefined,
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
		webauthnHints: string[],
		cachedUser: CachedUser | undefined,
	): Promise<
		Result<void, 'loginKeystoreFailed' | 'passkeyInvalid' | 'passkeyLoginFailedTryAgain' | 'passkeyLoginFailedServerError' | 'x-private-data-etag'>
	>,
	signupWebauthn(
		name: string,
		keystore: LocalStorageKeystore,
		promptForPrfRetry: () => Promise<boolean | AbortSignal>,
		webauthnHints: string[],
		retryFrom?: SignupWebauthnRetryParams,
	): Promise<Result<void, SignupWebauthnError>>,
	updatePrivateData(newPrivateData: EncryptedContainer): Promise<void>,
	updatePrivateDataEtag(resp: AxiosResponse): AxiosResponse,

	updateShowWelcome(showWelcome: boolean): void,

	addEventListener(type: ApiEventType, listener: EventListener, options?: boolean | AddEventListenerOptions): void,
	removeEventListener(type: ApiEventType, listener: EventListener, options?: boolean | EventListenerOptions): void,
	/** Register a storage hook handle to be cleared when `useApi().clearSession()` is invoked. */
	useClearOnClearSession<T>(storageHandle: UseStorageHandle<T>): UseStorageHandle<T>,

	syncPrivateData(
		cachedUser: CachedUser | undefined
	): Promise<Result<void,
		| 'syncFailed'
		| 'loginKeystoreFailed'
		| 'passkeyInvalid'
		| 'passkeyLoginFailedTryAgain'
		| 'passkeyLoginFailedServerError'
		| 'x-private-data-etag'
	>>;
}

export function useApi(isOnlineProp: boolean = true): BackendApi {
	const isOnline = useMemo(() => isOnlineProp === null ? true : isOnlineProp, [isOnlineProp]);
	const [appToken, setAppToken, clearAppToken] = useSessionStorage<string | null>("appToken", null);
	const [userHandle,] = useSessionStorage<string | null>("userHandle", null);
	const [cachedUsers] = useLocalStorage<CachedUser[] | null>("cachedUsers", null);

	const [sessionState, setSessionState, clearSessionState] = useSessionStorage<SessionState | null>("sessionState", null);

	/**
	 * Synchronization tag for the encrypted private data. To prevent data loss,
	 * this MUST be refreshed only when a new version of the private data is
	 * loaded into the keystore or successfully uploaded to the server.
	 */
	const getPrivateDataEtag = useCallback(() => {
		return jsonParseTaggedBinary(localStorage.getItem('privateDataEtag'));
	}, []);

	const setPrivateDataEtag = useCallback((v: string) => {
		localStorage.setItem('privateDataEtag', jsonStringifyTaggedBinary(v));
	}, []);

	const removePrivateDataEtag = useCallback(() => {
		localStorage.removeItem('privateDataEtag');
	}, []);

	const navigate = useNavigate();
	const clearSessionStorage = useClearStorages(clearAppToken, clearSessionState);

	const getAppToken = useCallback((): string | null => {
		return appToken;
	}, [appToken]);

	function transformResponse(data: any): any {
		if (data) {
			return jsonParseTaggedBinary(data);
		} else {
			return data;
		}
	}

	const updatePrivateDataEtag = useCallback((resp: AxiosResponse): AxiosResponse => {
		const newValue = resp.headers['x-private-data-etag']
		if (newValue) {
			setPrivateDataEtag(newValue);
		}
		return resp;
	}, [setPrivateDataEtag]);

	const buildGetHeaders = useCallback((
		headers: { [header: string]: string },
		options: { appToken?: string },
	): { [header: string]: string } => {
		const authz = options?.appToken || appToken;
		return {
			...headers,
			...(authz ? { Authorization: `Bearer ${authz}` } : {}),
		};
	}, [appToken]);

	const buildMutationHeaders = useCallback((
		headers: { [header: string]: string },
		options: { appToken?: string },
	): { [header: string]: string } => {
		return {
			...buildGetHeaders(headers, options),
			...(getPrivateDataEtag() ? { 'X-Private-Data-If-Match': getPrivateDataEtag() } : {}),
		};
	}, [buildGetHeaders, getPrivateDataEtag]);

	const getWithLocalDbKey = useCallback(async (
		path: string,
		dbKey: string,
		options?: { appToken?: string, headers?: { [header: string]: string } },
		forceIndexDB: boolean = false
	): Promise<AxiosResponse> => {
		console.log(`Get: ${path} ${isOnline ? 'online' : 'offline'} mode ${isOnline}`);

		// Offline case
		if (!isOnline && !EXCLUDED_INDEXEDDB_PATHS.has(path)) {
			return {
				data: await getItem(path, dbKey),
			} as AxiosResponse;
		}

		if (forceIndexDB && !EXCLUDED_INDEXEDDB_PATHS.has(path)) {
			const data = await getItem(path, dbKey);
			if (data) {
				return { data } as AxiosResponse;
			}
		}
		// Online case
		const respBackend = await axios.get(
			`${walletBackendUrl}${path}`,
			{
				headers: buildGetHeaders(options?.headers ?? {}, { appToken: options?.appToken }),
				validateStatus: status => (status >= 200 && status < 300) || status === 304,
				transformResponse,
			},
		);
		if (!EXCLUDED_INDEXEDDB_PATHS.has(path)) {
			await addItem(path, dbKey, respBackend.data);
		}
		return respBackend;
	}, [buildGetHeaders, isOnline]);

	const get = useCallback(async (
		path: string,
		options?: {
			appToken?: string,
			headers?: { [header: string]: string },
			userUuid?: string,
		},
	): Promise<AxiosResponse> => {
		return getWithLocalDbKey(path, sessionState?.uuid || options?.userUuid, options);
	}, [getWithLocalDbKey, sessionState?.uuid]);

	const getExternalEntity = useCallback(async (
		path: string,
		options?: { appToken?: string, headers?: { [header: string]: string } },
		force: boolean = false
	): Promise<AxiosResponse> => {
		return getWithLocalDbKey(path, path, options, force);
	}, [getWithLocalDbKey]);

	const fetchInitialData = useCallback(async (
		appToken: string,
		userUuid: string
	): Promise<void> => {
		try {
			// get('/storage/vc') on home page ('/')
			// get('/storage/vp') on home page ('/')
			await get('/user/session/account-info', { appToken, userUuid });
			await getExternalEntity('/verifier/all', { appToken }, false);
			// getExternalEntity('/issuer/all') on credentialContext
			// getCredentialIssuerMetadata() on credentialContext
		} catch (error) {
			console.error('Failed to perform get requests', error);
		}
	}, [get, getExternalEntity]);

	const post = useCallback(async (
		path: string,
		body: object,
		options?: { appToken?: string, headers?: { [header: string]: string } },
	): Promise<AxiosResponse> => {
		try {
			return await axios.post(
				`${walletBackendUrl}${path}`,
				body,
				{
					headers: {
						'Content-Type': 'application/json',
						...buildMutationHeaders(options?.headers ?? {}, { appToken: options?.appToken }),
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
	}, [buildMutationHeaders]);

	const del = useCallback((
		path: string,
		options?: { appToken?: string, headers?: { [header: string]: string } },
	): Promise<AxiosResponse> => {
		try {
			return axios.delete(
				`${walletBackendUrl}${path}`,
				{
					headers: buildMutationHeaders(options?.headers ?? {}, { appToken: options?.appToken }),
					transformResponse,
				});
		} catch (e) {
			if (e?.response?.status === 412 && (e?.response?.headers ?? {})['x-private-data-etag']) {
				return Promise.reject({ cause: 'x-private-data-etag' });
			}
			throw e;
		}
	}, [buildMutationHeaders]);

	const syncPrivateData = useCallback(async (
		cachedUser: CachedUser | undefined
	): Promise<Result<void,
		| 'syncFailed'
		| 'loginKeystoreFailed'
		| 'passkeyInvalid'
		| 'passkeyLoginFailedTryAgain'
		| 'passkeyLoginFailedServerError'
		| 'x-private-data-etag'
	>> => {

		try {
			if (!isOnline) {
				return Ok.EMPTY;
			}
			const getPrivateDataResponse = await get('/user/session/private-data', { headers: { 'If-None-Match': getPrivateDataEtag() } });
			if (getPrivateDataResponse.status === 304) {
				return Ok.EMPTY; // already synced
			}
			const queryParams = new URLSearchParams(window.location.search);
			queryParams.delete('user');
			queryParams.delete('sync');

			queryParams.append('user', cachedUser.userHandleB64u);
			queryParams.append('sync', 'fail');

			navigate(`${window.location.pathname}?${queryParams.toString()}`, { replace: true });
			return Err('syncFailed');
			// const privateData = await parsePrivateData(getPrivateDataResponse.data.privateData);
			// return await loginWebauthn(keystore, promptForPrfRetry, cachedUser);
		}
		catch (err) {
			console.error(err);
			return Err('syncFailed');
		}

	}, [getPrivateDataEtag, get, navigate, isOnline]);

	const updateShowWelcome = useCallback((showWelcome: boolean): void => {
		if (sessionState) {
			setSessionState((prevState) => ({
				...prevState,
				showWelcome: showWelcome,
			}));
		}
	}, [sessionState, setSessionState]);

	const getSession = useCallback((): SessionState => {
		return sessionState;
	}, [sessionState]);

	const isLoggedIn = useCallback((): boolean => {
		return getSession() !== null;
	}, [getSession]);

	const clearSession = useCallback((): void => {
		clearSessionStorage();
		removePrivateDataEtag();
		events.dispatchEvent(new CustomEvent<ClearSessionEvent>(CLEAR_SESSION_EVENT));
	}, [clearSessionStorage, removePrivateDataEtag]);

	const setSession = useCallback(async (
		response: AxiosResponse,
		credential: PublicKeyCredential | null,
		authenticationType: 'signup' | 'login'
	): Promise<void> => {
		setAppToken(response.data.appToken);
		setSessionState({
			uuid: response.data.uuid,
			displayName: response.data.displayName,
			username: response.data.username,
			webauthnCredentialCredentialId: credential?.id,
			authenticationType,
			showWelcome: authenticationType === 'signup',
		});

		await addItem('users', response.data.uuid, response.data);
		if (isOnline) {
			await fetchInitialData(response.data.appToken, response.data.uuid).catch((error) => console.error('Error in performGetRequests', error));
		}
	}, [setAppToken, setSessionState, fetchInitialData, isOnline]);

	const updatePrivateData = useCallback(async (
		newPrivateData: EncryptedContainer,
		options?: { appToken?: string }
	): Promise<void> => {
		try {
			async function writeOnIndexedDB() {
				if (!userHandle) {
					return;
				}
				const userId = UserId.fromUserHandle(fromBase64Url(userHandle));
				const userObject = await getItem("users", userId.id);
				if (!userObject) {
					throw new Error(`Could not find user with userHandle ${userHandle} on indexedDB 'users' table`);
				}
				userObject.privateData = serializePrivateData(newPrivateData);
				await addItem("users", userId.id, userObject);
			}

			if (!isOnline) {
				await writeOnIndexedDB();
				console.log("Cannot write to remote keystore while offline");
				return;
			}
			const updateResp = updatePrivateDataEtag(
				await post('/user/session/private-data', serializePrivateData(newPrivateData), options),
			);
			if (updateResp.status === 204) {
				await writeOnIndexedDB();
				return;
			} else {
				console.error("Failed to update private data", updateResp.status, updateResp);
				return Promise.reject(updateResp);
			}
		} catch (e) {
			console.error("Failed to update private data", e, e?.response?.status);
			if ((e?.response?.status === 412 && (e?.headers ?? {})['x-private-data-etag']) || (e.cause === 'x-private-data-etag')) {
				console.error("Private data version conflict", { cause: 'x-private-data-etag' });
				const cachedUser = cachedUsers.filter((u) => u.userHandleB64u === userHandle)[0];
				await syncPrivateData(cachedUser);
				return;
			}
			throw e;
		}
	}, [post, updatePrivateDataEtag, cachedUsers, userHandle, syncPrivateData, isOnline]);

	const login = useCallback(async (
		username: string,
		password: string,
		keystore: LocalStorageKeystore
	): Promise<Result<void, any>> => {
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
				await setSession(response, null, 'login');
				return Ok.EMPTY;
			} catch (e) {
				console.error("Failed to unlock local keystore", e);
				return Err(e);
			}

		} catch (error) {
			console.error('Failed to log in', error);
			return Err(error);
		}
	}, [post, setSession, updatePrivateDataEtag, updatePrivateData]);

	const signup = useCallback(async (
		username: string,
		password: string,
		keystore: LocalStorageKeystore
	): Promise<Result<void, any>> => {
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
				await setSession(response, null, 'signup');
				return Ok.EMPTY;

			} catch (e) {
				console.error("Signup failed", e);
				return Err(e);
			}

		} catch (e) {
			console.error("Failed to initialize local keystore", e);
			return Err(e);
		}
	}, [post, setSession, updatePrivateDataEtag]);

	const getAllVerifiers = useCallback(async (): Promise<Verifier[]> => {
		try {
			const result = await getExternalEntity('/verifier/all', undefined, true);
			const verifiers = result.data;
			console.log("verifiers = ", verifiers)
			return verifiers;
		}
		catch (error) {
			console.error("Failed to fetch all verifiers", error);
			throw error;
		}
	}, [getExternalEntity]);

	const getAllPresentations = useCallback(async (): Promise<{ vp_list: any[] }> => {
		try {
			const result = await get('/storage/vp');
			return result.data; // Return the Axios response.
		}
		catch (error) {
			console.error("Failed to fetch all presentations", error);
			throw error;
		}
	}, [get]);

	const initiatePresentationExchange = useCallback(async (
		verifier_id: number,
		scope_name: string
	): Promise<{ redirect_to?: string }> => {
		try {
			const result = await post('/presentation/initiate', { verifier_id, scope_name });
			const { redirect_to } = result.data;
			return { redirect_to };
		}
		catch (error) {
			console.error("Failed to fetch all verifiers", error);
			throw error;
		}
	}, [post]);

	const loginWebauthn = useCallback(async (
		keystore: LocalStorageKeystore,
		promptForPrfRetry: () => Promise<boolean | AbortSignal>,
		webauthnHints: string[],
		cachedUser: CachedUser | undefined
	): Promise<Result<void,
		| 'loginKeystoreFailed'
		| 'passkeyInvalid'
		| 'passkeyLoginFailedTryAgain'
		| 'passkeyLoginFailedServerError'
		| 'x-private-data-etag'
	>> => {
		try {
			const beginData = await (async (): Promise<{
				challengeId?: string,
				getOptions: { publicKey: PublicKeyCredentialRequestOptions },
			}> => {
				if (isOnline) {
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
				const credential = await navigator.credentials.get({
					...getOptions,
					publicKey: withHintsFromAllowCredentials({
						...getOptions.publicKey,
						hints: webauthnHints,
					}),
				}) as PublicKeyCredential;
				const response = credential.response as AuthenticatorAssertionResponse;

				try {
					const finishResp = await (async () => {
						if (isOnline) {
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
									username: null,
								},
							};
						}
					})() as any;

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
						await setSession(finishResp, credential, 'login');
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
	}, [post, updatePrivateDataEtag, updatePrivateData, setSession, isOnline]);

	const signupWebauthn = useCallback(async (
		name: string,
		keystore: LocalStorageKeystore,
		promptForPrfRetry: () => Promise<boolean | AbortSignal>,
		webauthnHints: string[],
		retryFrom?: SignupWebauthnRetryParams
	): Promise<Result<void, SignupWebauthnError>> => {
		try {
			const beginData = retryFrom?.beginData || (await post('/user/register-webauthn-begin', {})).data;
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
						hints: webauthnHints,
						authenticatorSelection: withAuthenticatorAttachmentFromHints(beginData.createOptions.publicKey.authenticatorSelection, webauthnHints),
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
						const finishResp = updatePrivateDataEtag(await post('/user/register-webauthn-finish', {
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
						await setSession(finishResp, credential, 'signup');
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
	}, [post, updatePrivateDataEtag, setSession]);

	const addEventListener = useCallback((type: ApiEventType, listener: EventListener, options?: boolean | AddEventListenerOptions): void => {
		events.addEventListener(type, listener, options);
	}, []);

	const removeEventListener = useCallback((type: ApiEventType, listener: EventListener, options?: boolean | EventListenerOptions): void => {
		events.removeEventListener(type, listener, options);
	}, []);

	const stableUseClearOnClearSession = useMemo(() => {
		return function useClearOnClearSession<T>(storageHandle: UseStorageHandle<T>): UseStorageHandle<T> {
			const [, , clearHandle] = storageHandle;

			useEffect(() => {
				const listener = () => clearHandle();
				events.addEventListener(CLEAR_SESSION_EVENT, listener);
				return () => {
					events.removeEventListener(CLEAR_SESSION_EVENT, listener);
				};
			}, [clearHandle]);

			return storageHandle;
		};
	}, []);


	const memoizedApi = useMemo(() => ({
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

		syncPrivateData,
	}), [
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

		syncPrivateData,
	]);

	return {
		...memoizedApi,
		useClearOnClearSession: stableUseClearOnClearSession,
	};
}
