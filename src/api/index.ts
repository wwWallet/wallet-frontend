import axios, { AxiosResponse } from 'axios';
import { Err, Ok, Result } from 'ts-results';

import { fetchToken } from '../firebase';
import { jsonParseTaggedBinary, jsonStringifyTaggedBinary, toBase64Url } from '../util';
import { CachedUser, LocalStorageKeystore, makePrfExtensionInputs } from '../services/LocalStorageKeystore';
import { UserData, Verifier } from './types';
import { useMemo } from 'react';
import { useClearSessionStorage, useSessionStorage } from '../components/useStorage';


const walletBackendUrl = process.env.REACT_APP_WALLET_BACKEND_URL;


type SessionState = {
	username: string,
	displayName: string,
	webauthnCredentialCredentialId: string,
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

export interface BackendApi {
	del(path: string): Promise<AxiosResponse>,
	get(path: string): Promise<AxiosResponse>,
	post(path: string, body: object): Promise<AxiosResponse>,

	getSession(): SessionState,
	isLoggedIn(): boolean,
	getAppToken(): string | undefined,
	clearSession(): void,
	getAppToken(): string | null,

	login(username: string, password: string, keystore: LocalStorageKeystore): Promise<Result<void, any>>,
	signup(username: string, password: string, keystore: LocalStorageKeystore): Promise<Result<void, any>>,
	getAllVerifiers(): Promise<Verifier[]>,
	getAllPresentations(): Promise<AxiosResponse>,
	initiatePresentationExchange(verifier_id: number, scope_name: string): Promise<{ redirect_to?: string }>,

	loginWebauthn(
		keystore: LocalStorageKeystore,
		promptForPrfRetry: () => Promise<boolean>,
		cachedUser: CachedUser | undefined,
	): Promise<
		Result<void, 'loginKeystoreFailed' | 'passkeyInvalid' | 'passkeyLoginFailedTryAgain' | 'passkeyLoginFailedServerError'>
	>,
	signupWebauthn(
		name: string,
		keystore: LocalStorageKeystore,
		promptForPrfRetry: () => Promise<boolean>,
		retryFrom?: SignupWebauthnRetryParams,
	): Promise<Result<void, SignupWebauthnError>>,
}

export function useApi(): BackendApi {
	const clearSessionStorage = useClearSessionStorage();
	const [appToken, setAppToken,] = useSessionStorage<string | null>("appToken", null);
	const [sessionState, setSessionState,] = useSessionStorage<SessionState | null>("sessionState", null);

	return useMemo(
		() => {
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

			async function get(path: string): Promise<AxiosResponse> {
				return await axios.get(
					`${walletBackendUrl}${path}`,
					{
						headers: {
							Authorization: `Bearer ${appToken}`,
						},
						transformResponse,
					},
				);
			}

			async function post(path: string, body: object): Promise<AxiosResponse> {
				return await axios.post(
					`${walletBackendUrl}${path}`,
					body,
					{
						headers: {
							Authorization: `Bearer ${appToken}`,
							'Content-Type': 'application/json',
						},
						transformRequest: (data, headers) => jsonStringifyTaggedBinary(data),
						transformResponse,
					},
				);
			}

			async function del(path: string): Promise<AxiosResponse> {
				return await axios.delete(
					`${walletBackendUrl}${path}`,
					{
						headers: {
							Authorization: `Bearer ${appToken}`,
						},
						transformResponse,
					});
			}

			function getSession(): SessionState {
				return sessionState;
			}

			function isLoggedIn(): boolean {
				return getSession() !== null;
			}

			function clearSession(): void {
				clearSessionStorage();
			}

			function setSession(response: AxiosResponse, credential: PublicKeyCredential | null): void {
				setAppToken(response.data.appToken);
				setSessionState({
					displayName: response.data.displayName,
					username: response.data.username,
					webauthnCredentialCredentialId: credential?.id,
				});
			}

			async function login(username: string, password: string, keystore: LocalStorageKeystore): Promise<Result<void, any>> {
				try {
					const response = await post('/user/login', { username, password });
					setSession(response, null);

					const userData = response.data as UserData;
					const privateData = jsonParseTaggedBinary(userData.privateData);
					try {
						await keystore.unlockPassword(privateData, password, privateData.passwordKey);
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
				const fcm_token = await fetchToken();

				try {
					const { publicData, privateData } = await keystore.initPassword(password);

					try {
						const response = await post('/user/register', {
							username,
							password,
							fcm_token,
							displayName: username,
							keys: publicData,
							privateData: jsonStringifyTaggedBinary(privateData),
						});
						setSession(response, null);
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

			async function getAllVerifiers(): Promise<Verifier[]> {
				try {
					const result = await get('/verifiers/all');
					const { verifiers } = result.data;
					console.log("verifiers = ", verifiers)
					return verifiers;
				}
				catch (error) {
					console.error("Failed to fetch all verifiers", error);
					throw error;
				}
			}

			async function getAllPresentations(): Promise<AxiosResponse> {
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
				promptForPrfRetry: () => Promise<boolean>,
				cachedUser: CachedUser | undefined,
			): Promise<
				Result<void, 'loginKeystoreFailed' | 'passkeyInvalid' | 'passkeyLoginFailedTryAgain' | 'passkeyLoginFailedServerError'>
			> {
				try {
					const beginResp = await post('/user/login-webauthn-begin', {});
					console.log("begin", beginResp);
					const beginData = beginResp.data;

					try {
						const prfInputs = cachedUser && makePrfExtensionInputs(cachedUser.prfKeys);
						const getOptions = prfInputs
							? {
								...beginData.getOptions,
								publicKey: {
									...beginData.getOptions.publicKey,
									allowCredentials: prfInputs.allowCredentials,
									extensions: {
										...beginData.getOptions.extensions,
										prf: prfInputs.prfInput,
									},
								},
							}
							: beginData.getOptions;
						const credential = await navigator.credentials.get(getOptions) as PublicKeyCredential;
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
										userHandle: response.userHandle ? toBase64Url(response.userHandle) : cachedUser?.userHandleB64u,
									},
									authenticatorAttachment: credential.authenticatorAttachment,
									clientExtensionResults: credential.getClientExtensionResults(),
								},
							});

							try {
								const userData = finishResp.data as UserData;
								const privateData = jsonParseTaggedBinary(userData.privateData);
								await keystore.unlockPrf(
									privateData,
									credential,
									beginData.getOptions.publicKey.rpId,
									promptForPrfRetry,
									cachedUser || {
										...userData,
										// response.userHandle will always be non-null if cachedUser is
										// null, because then allowCredentials was empty
										userHandle: new Uint8Array(response.userHandle),
									},
								);
								setSession(finishResp, credential);
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

			async function signupWebauthn(
				name: string,
				keystore: LocalStorageKeystore,
				promptForPrfRetry: () => Promise<boolean>,
				retryFrom?: SignupWebauthnRetryParams,
			): Promise<Result<void, SignupWebauthnError>> {
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
							},
						}) as PublicKeyCredential;
						const response = credential.response as AuthenticatorAttestationResponse;
						console.log("created", credential);

						try {
							const { publicData, privateData } = await keystore.initPrf(
								credential,
								prfSalt,
								beginData.createOptions.publicKey.rp.id,
								promptForPrfRetry,
								{ displayName: name, userHandle: beginData.createOptions.publicKey.user.id },
							);

							try {

								const fcm_token = await fetchToken();

								const finishResp = await post('/user/register-webauthn-finish', {
									challengeId: beginData.challengeId,
									fcm_token,
									displayName: name,
									keys: publicData,
									privateData: jsonStringifyTaggedBinary(privateData),
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
								setSession(finishResp, credential);
								return Ok.EMPTY;

							} catch (e) {
								return Err('passkeySignupFailedServerError');
							}

						} catch (e) {
							if (e?.errorId === "prf_retry_failed") {
								return Err({ errorId: 'prfRetryFailed', retryFrom: { credential, beginData } });
							} else if (e?.errorId === "prf_not_supported") {
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

			return {
				del,
				get,
				post,

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
			}
		},
		[
			appToken,
			clearSessionStorage,
			sessionState,
			setAppToken,
			setSessionState,
		],
	);
}
