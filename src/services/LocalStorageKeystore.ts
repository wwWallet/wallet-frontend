import { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate } from 'react-router-dom';

import * as config from "../config";
import { useClearStorages, useLocalStorage, useSessionStorage } from "../hooks/useStorage";
import { fromBase64Url, jsonStringifyTaggedBinary, toBase64Url } from "../util";
import { useIndexedDb } from "../hooks/useIndexedDb";
import { useOnUserInactivity } from "../hooks/useOnUserInactivity";

import * as keystore from "./keystore";
import type { AsymmetricEncryptedContainer, AsymmetricEncryptedContainerKeys, EncryptedContainer, OpenedContainer, PrivateData, UnlockSuccess, WebauthnPrfEncryptionKeyInfo, WebauthnPrfSaltInfo, WrappedKeyInfo } from "./keystore";
import { MDoc } from "@auth0/mdl";
import { WalletStateUtils } from "./WalletStateUtils";
import { addAlterSettingsEvent, addDeleteCredentialEvent, addDeleteCredentialIssuanceSessionEvent, addDeleteKeypairEvent, addNewCredentialEvent, addNewPresentationEvent, addSaveCredentialIssuanceSessionEvent, CurrentSchema, foldOldEventsIntoBaseState, foldState, mergeEventHistories } from "./WalletStateSchema";
import { UserId } from "@/api/types";
import { getItem } from "@/indexedDB";
import { WalletStateContainerGeneric } from "./WalletStateSchemaCommon";

type WalletState = CurrentSchema.WalletState;
type WalletStateCredential = CurrentSchema.WalletStateCredential;
type WalletStateCredentialIssuanceSession = CurrentSchema.WalletStateCredentialIssuanceSession;
type WalletStatePresentation = CurrentSchema.WalletStatePresentation;
type WalletStateSettings = CurrentSchema.WalletStateSettings;

type UserData = {
	displayName: string;
	userHandle: Uint8Array;
}

export type CachedUser = {
	displayName: string;

	// Authenticator may return `userHandle: null` when authenticating with
	// non-empty `allowCredentials` (which we do when evaluating PRF), but the
	// backend requires the user handle during login (which we do simultaneously
	// with PRF evaluation for cached credentials)
	userHandleB64u: string;

	prfKeys: WebauthnPrfSaltInfo[];
}

export enum KeystoreEvent {
	/** This event should be propagated to needed tabs which must clean SessionStorage. */
	CloseSessionTabLocal = 'keystore.closeSessionTabLocal',
}

export type CommitCallback = () => Promise<void>;
export interface LocalStorageKeystore {
	isOpen(): boolean,
	close(): Promise<void>,

	initPassword(password: string): Promise<[EncryptedContainer, (userHandleB64u: string) => void]>,
	initPrf(
		credential: PublicKeyCredential,
		prfSalt: Uint8Array,
		promptForPrfRetry: () => Promise<boolean | AbortSignal>,
		user: UserData,
	): Promise<EncryptedContainer>,
	addPrf(
		credential: PublicKeyCredential,
		promptForPrfRetry: () => Promise<boolean | AbortSignal>,
	): Promise<[EncryptedContainer, CommitCallback]>,
	deletePrf(credentialId: Uint8Array): [EncryptedContainer, CommitCallback],
	unlockPassword(
		privateData: EncryptedContainer,
		password: string,
		user: UserData,
	): Promise<[EncryptedContainer, CommitCallback] | null>,
	unlockPrf(
		privateData: EncryptedContainer,
		credential: PublicKeyCredential,
		promptForPrfRetry: () => Promise<boolean | AbortSignal>,
		user: CachedUser | UserData,
	): Promise<[EncryptedContainer, CommitCallback] | null>,
	getPrfKeyInfo(id: BufferSource): WebauthnPrfEncryptionKeyInfo,
	getPasswordOrPrfKeyFromSession(
		promptForPassword: () => Promise<string | null>,
		promptForPrfRetry: () => Promise<boolean | AbortSignal>,
	): Promise<[CryptoKey, WrappedKeyInfo]>,
	upgradePrfKey(prfKeyInfo: WebauthnPrfEncryptionKeyInfo, promptForPrfRetry: () => Promise<boolean | AbortSignal>): Promise<[EncryptedContainer, CommitCallback]>,
	getCachedUsers(): CachedUser[],
	forgetCachedUser(user: CachedUser): void,
	getUserHandleB64u(): string | null,
	signJwtPresentation(nonce: string, audience: string, verifiableCredentials: any[], transactionDataResponseParams?: { transaction_data_hashes: string[], transaction_data_hashes_alg: string[] }): Promise<{ vpjwt: string }>,
	generateOpenid4vciProofs(requests: { nonce: string, audience: string, issuer: string }[]): Promise<[
		{ proof_jwts: string[] },
		AsymmetricEncryptedContainer,
		CommitCallback,
	]>,

	generateKeypairs(n: number): Promise<[
		{ keypairs: keystore.CredentialKeyPair[] },
		AsymmetricEncryptedContainer,
		CommitCallback,
	]>,

	generateDeviceResponse(mdocCredential: MDoc, presentationDefinition: any, mdocGeneratedNonce: string, verifierGeneratedNonce: string, clientId: string, responseUri: string): Promise<{ deviceResponseMDoc: MDoc }>,
	generateDeviceResponseWithProximity(mdocCredential: MDoc, presentationDefinition: any, sessionTranscriptBytes: any): Promise<{ deviceResponseMDoc: MDoc }>,

	getCalculatedWalletState(): WalletState | null,
	addCredentials(credentials: { data: string, format: string, kid: string, batchId: number, credentialIssuerIdentifier: string, credentialConfigurationId: string, instanceId: number, credentialId?: number }[]): Promise<[
		{},
		AsymmetricEncryptedContainer,
		CommitCallback,
	]>,
	deleteCredentialsByBatchId(batchId: number): Promise<[
		{},
		AsymmetricEncryptedContainer,
		CommitCallback,
	]>,
	getAllCredentials(): Promise<WalletStateCredential[] | null>,
	addPresentations(presentations: { transactionId: number, data: string, usedCredentialIds: number[], audience: string, }[]): Promise<[
		{},
		AsymmetricEncryptedContainer,
		CommitCallback,
	]>,
	getAllPresentations(): Promise<WalletStatePresentation[] | null>,
	saveCredentialIssuanceSessions(newIssuanceSessions: WalletStateCredentialIssuanceSession[], deletedSessions: number[]): Promise<[
		{},
		AsymmetricEncryptedContainer,
		CommitCallback,
	]>,
	getCredentialIssuanceSessionByState(state: string): Promise<WalletStateCredentialIssuanceSession | null>,
	alterSettings(settings: WalletStateSettings): Promise<[
		{},
		AsymmetricEncryptedContainer,
		CommitCallback,
	]>,
}

/** A stateful wrapper around the keystore module, storing state in the browser's localStorage and sessionStorage. */
export function useLocalStorageKeystore(eventTarget: EventTarget): LocalStorageKeystore {
	const [cachedUsers, setCachedUsers,] = useLocalStorage<CachedUser[]>("cachedUsers", []);
	const [privateData, setPrivateData] = useState<EncryptedContainer | null>(null);

	const [globalUserHandleB64u, setGlobalUserHandleB64u, clearGlobalUserHandleB64u] = useLocalStorage<string | null>("userHandle", null);
	const [userHandleB64u, setUserHandleB64u, clearUserHandleB64u] = useSessionStorage<string | null>("userHandle", null);

	// A unique id for each logged in tab
	const [globalTabId, setGlobalTabId, clearGlobalTabId] = useLocalStorage<string | null>("globalTabId", null);
	const [tabId, setTabId, clearTabId] = useSessionStorage<string | null>("tabId", null);

	const [mainKey, setMainKey, clearMainKey] = useSessionStorage<BufferSource | null>("mainKey", null);
	const [calculatedWalletState, setCalculatedWalletState] = useState<WalletState | null>(null);
	const clearSessionStorage = useClearStorages(clearUserHandleB64u, clearMainKey, clearTabId);

	const navigate = useNavigate();

	const idb = useIndexedDb("wallet-frontend", 3, useCallback((db, prevVersion, newVersion) => {
		if (prevVersion < 1) {
			const objectStore = db.createObjectStore("keys", { keyPath: "id" });
			objectStore.createIndex("id", "id", { unique: true });
		}
		if (prevVersion < 2) {
			if (db.objectStoreNames.contains("keys")) {
				db.deleteObjectStore("keys");
			}
		}

		if (prevVersion < 3) {
			db.createObjectStore("privateData", { keyPath: "userHandle" });
		}
	}, []));

	const readPrivateDataFromIdb = useCallback(async (userHandleB64u: string): Promise<EncryptedContainer | null> => {
		const result = await idb.read(['privateData'], (tx) => {
			const store = tx.objectStore("privateData");
			return store.get(userHandleB64u);
		});
		return result ? result.content : null;
	}, [idb]);

	useEffect(() => {
		if (userHandleB64u) {
			readPrivateDataFromIdb(userHandleB64u).then((val) => {
				if (val) {
					setPrivateData(val);
				}
			})
		}
	}, [userHandleB64u, readPrivateDataFromIdb]);


	const writePrivateDataOnIdb = useCallback(async (privateData: EncryptedContainer | null, userHandleB64u: string) => {
		await idb.write(["privateData"], (tx) => {
			const store = tx.objectStore("privateData");
			return store.put({ userHandle: userHandleB64u, content: privateData });
		})
	}, [idb]);

	const clearPrivateData = useCallback(async (userHandleB64u: string) => {
		setPrivateData(null);
		await writePrivateDataOnIdb(null, userHandleB64u);
	}, [writePrivateDataOnIdb]);

	const closeSessionTabLocal = useCallback(
		async (): Promise<void> => {
			eventTarget.dispatchEvent(new CustomEvent(KeystoreEvent.CloseSessionTabLocal));
			clearSessionStorage();
		},
		[clearSessionStorage, eventTarget],
	);

	const close = useCallback(
		async (): Promise<void> => {
			console.log('Keystore Close');
			await clearPrivateData(userHandleB64u);
			await idb.destroy();
			setCalculatedWalletState(null);
			clearGlobalUserHandleB64u();
			clearGlobalTabId();
		},
		[idb, clearGlobalUserHandleB64u, clearGlobalTabId, clearPrivateData, setCalculatedWalletState, userHandleB64u],
	);

	const assertKeystoreOpen = useCallback(async (): Promise<[EncryptedContainer, CryptoKey]> => {
		if (privateData && mainKey) {
			return [privateData, await keystore.importMainKey(mainKey)];
		} else {
			throw new Error("Key store is closed.", { cause: 'keystore_closed' });
		}
	}, [privateData, mainKey]);

	useOnUserInactivity(close, config.INACTIVE_LOGOUT_MILLIS);

	useEffect(
		() => {
			if (privateData && userHandleB64u && (userHandleB64u === globalUserHandleB64u)) {
				// When PRF keys are added, deleted or edited in any tab,
				// propagate changes to cached users
				setCachedUsers((cachedUsers) => cachedUsers.map((cu) => {
					if (cu.userHandleB64u === userHandleB64u) {
						return {
							...cu,
							prfKeys: privateData.prfKeys.map((keyInfo) => ({
								credentialId: keyInfo.credentialId,
								transports: keyInfo.transports,
								prfSalt: keyInfo.prfSalt,
							})),
						};
					} else {
						return cu;
					}
				}));
			}
		},
		[closeSessionTabLocal, privateData, userHandleB64u, globalUserHandleB64u, setCachedUsers],
	);

	useEffect(
		() => {
			if (tabId && globalTabId && (tabId !== globalTabId)) {
				// When user logs in in any tab, log out in all other tabs
				closeSessionTabLocal();
			}
		},
		[closeSessionTabLocal, tabId, globalTabId],
	);

	useEffect(() => {
		const checkPrivateData = async () => {
			if (!globalUserHandleB64u) {
				closeSessionTabLocal();
				return;
			}

			const privateData = await readPrivateDataFromIdb(globalUserHandleB64u);
			if (!privateData) {
				closeSessionTabLocal();
			}
		};

		checkPrivateData();
	}, [closeSessionTabLocal, globalUserHandleB64u, readPrivateDataFromIdb]);

	const openPrivateData = useCallback(async (): Promise<[PrivateData, CryptoKey, WalletState]> => {
		const [privateData, mainKey] = await assertKeystoreOpen();
		try {
			return await keystore.openPrivateData(mainKey, privateData);
		}
		catch (err) {
			console.error(err);
			console.log("Navigating to login-state to handle JWE decryption failure");
			const queryParams = new URLSearchParams(window.location.search);
			queryParams.delete('user');
			queryParams.delete('sync');

			queryParams.append('user', userHandleB64u);
			queryParams.append('sync', 'fail');
			navigate(`${window.location.pathname}?${queryParams.toString()}`, { replace: true });
			return null;
		}
	}, [assertKeystoreOpen, navigate, userHandleB64u]);

	const editPrivateData = useCallback(async <T>(
		action: (container: OpenedContainer) => Promise<[T, OpenedContainer]>,
	): Promise<[T, AsymmetricEncryptedContainer, CommitCallback]> => {
		const [privateData, mainKey] = await assertKeystoreOpen();
		const [result, [newPrivateData, newMainKey]] = await action(
			[
				keystore.assertAsymmetricEncryptedContainer(privateData),
				mainKey,
			],
		);
		// after private data update, the calculated wallet state must be re-computed
		const [, , newCalculatedWalletState] = await keystore.openPrivateData(newMainKey, newPrivateData);
		return [
			result,
			newPrivateData,
			async () => {
				await writePrivateDataOnIdb(newPrivateData, userHandleB64u);
				setCalculatedWalletState(newCalculatedWalletState);
				setPrivateData(newPrivateData);
				setMainKey(await keystore.exportMainKey(newMainKey));
			},
		];
	}, [setPrivateData, setMainKey, assertKeystoreOpen, userHandleB64u, writePrivateDataOnIdb]);

	const finishUnlock = useCallback(async (
		unlockSuccess: UnlockSuccess,
		user: CachedUser | UserData | null,
		credential: PublicKeyCredential | null,
		promptForPrfRetry: () => Promise<boolean | AbortSignal>,
	): Promise<keystore.EncryptedContainer> => {
		if (user) {
			const userHandleB64u = ("prfKeys" in user
				? user.userHandleB64u
				: toBase64Url(user.userHandle)
			);
			let newEncryptedContainer: keystore.EncryptedContainer;

			if (privateData) { // keystore is already opened
				const [localPrivateData, localMainKey] = await assertKeystoreOpen();
				const [remoteContainer, remoteMainKey,] = await keystore.openPrivateData(unlockSuccess.mainKey, unlockSuccess.privateData);
				const [localContainer, ,] = await keystore.openPrivateData(localMainKey, localPrivateData);
				const mergedContainer = await mergeEventHistories(remoteContainer, localContainer);
				const { newContainer } = await keystore.updateWalletState([
					keystore.assertAsymmetricEncryptedContainer(unlockSuccess.privateData),
					remoteMainKey,
				], mergedContainer as CurrentSchema.WalletStateContainer);
				const [newPrivateDataEncryptedContainer, newMainKey] = newContainer;
				await writePrivateDataOnIdb(newPrivateDataEncryptedContainer, userHandleB64u);
				setPrivateData(newPrivateDataEncryptedContainer);
				newEncryptedContainer = newPrivateDataEncryptedContainer;
				setMainKey(await keystore.exportMainKey(newMainKey));
				const foldedState = foldState(mergedContainer as CurrentSchema.WalletStateContainer);
				setCalculatedWalletState(foldedState);
			}
			else {
				async function mergeWithLocalEncryptedPrivateData(container: [EncryptedContainer, CryptoKey, WalletStateContainerGeneric]): Promise<[EncryptedContainer, CryptoKey, WalletStateContainerGeneric]> {
					const userId = UserId.fromUserHandle(fromBase64Url(userHandleB64u));
					const localUser = await getItem("users", userId.id);
					if (!localUser) {
						return container;
					}
					const localPrivateData: Uint8Array = localUser.privateData;
					const parsedLocalEncryptedPrivateData = await keystore.parsePrivateData(localPrivateData);
					const stringifiedLocalPrivateData = jsonStringifyTaggedBinary(localPrivateData);
					const stringifiedSerializedNewlyUnlockedPrivateData = jsonStringifyTaggedBinary(keystore.serializePrivateData(unlockSuccess.privateData));
					if (stringifiedLocalPrivateData !== stringifiedSerializedNewlyUnlockedPrivateData) { // local and remote are different
						// decryption of local is required
						const [unlockPrfResult,] = await keystore.unlockPrf(parsedLocalEncryptedPrivateData, credential, promptForPrfRetry);
						const { privateData, mainKey } = unlockPrfResult;
						const [localContainer, ,] = await keystore.openPrivateData(mainKey, privateData);
						const mergedContainer = await mergeEventHistories(unlockedContainer, localContainer);
						const { newContainer } = await keystore.updateWalletState([
							keystore.assertAsymmetricEncryptedContainer(unlockSuccess.privateData),
							unlockSuccess.mainKey,
						], mergedContainer as CurrentSchema.WalletStateContainer);
						const [newPrivateDataEncryptedContainer, newMainKey] = newContainer;
						return [newPrivateDataEncryptedContainer, newMainKey, mergedContainer];
					}
					return container;
				}
				const { privateData, mainKey } = unlockSuccess;
				const [unlockedContainer, ,] = await keystore.openPrivateData(mainKey, privateData);
				const [encryptedContainer, newMainKey, decryptedWalletState] = await mergeWithLocalEncryptedPrivateData([privateData, mainKey, unlockedContainer]);
				const foldedState = foldState(decryptedWalletState as CurrentSchema.WalletStateContainer);
				newEncryptedContainer = encryptedContainer;
				setPrivateData(encryptedContainer);
				setMainKey(await keystore.exportMainKey(newMainKey));
				await writePrivateDataOnIdb(encryptedContainer, userHandleB64u);
				// after private data update, the calculated wallet state must be re-computed
				setCalculatedWalletState(foldedState);
			}

			const newUser = ("prfKeys" in user
				? user
				: {
					displayName: user.displayName,
					userHandleB64u,
					prfKeys: [], // Placeholder - will be updated by useEffect above
				}
			);

			setUserHandleB64u(userHandleB64u);

			const newTabId = tabId ?? WalletStateUtils.getRandomUint32().toString();
			setTabId(newTabId);
			setGlobalTabId(newTabId);

			// This must happen before setPrivateData in order to prevent the
			// useEffect updating cachedUsers from corrupting cache entries for other
			// users logged in in other tabs.
			setGlobalUserHandleB64u(userHandleB64u);

			setCachedUsers((cachedUsers) => {
				// Move most recently used user to front of list
				const otherUsers = (cachedUsers || []).filter((cu) => cu.userHandleB64u !== newUser.userHandleB64u);
				return [newUser, ...otherUsers];
			});

			return newEncryptedContainer;
		}
	}, [
		setUserHandleB64u,
		setGlobalUserHandleB64u,
		setCachedUsers,
		setMainKey,
		setPrivateData,
		setCalculatedWalletState,
		setTabId,
		setGlobalTabId,
		tabId,
		writePrivateDataOnIdb,
		assertKeystoreOpen,
		privateData,
	]);


	useEffect(() => {
		// initialize calculated wallet state
		if (mainKey && privateData && calculatedWalletState === null) {
			openPrivateData().then(([, , newCalculatedWalletState]) => {

				setCalculatedWalletState(newCalculatedWalletState);
			});
		}
	}, [mainKey, privateData, calculatedWalletState, openPrivateData]);

	const init = useCallback(async (
		mainKey: CryptoKey,
		keyInfo: AsymmetricEncryptedContainerKeys,
		user: UserData,
	): Promise<EncryptedContainer> => {
		const unlocked = await keystore.init(mainKey, keyInfo);
		const privateData = await finishUnlock(unlocked, user, null);
		return privateData;
	},
		[finishUnlock]
	);

	const unlockPassword = useCallback(
		async (
			privateData: EncryptedContainer,
			password: string,
			user: UserData,
		): Promise<[EncryptedContainer, CommitCallback] | null> => {
			const [unlockResult, newPrivateData] = await keystore.unlockPassword(privateData, password);
			await finishUnlock(unlockResult, user, null);
			return (
				newPrivateData
					?
					[newPrivateData,
						async () => {
							await writePrivateDataOnIdb(newPrivateData, userHandleB64u);
							setPrivateData(newPrivateData);
						},
					]
					: null
			);
		},
		[finishUnlock, setPrivateData, writePrivateDataOnIdb, userHandleB64u]
	);

	const initPrf = useCallback(
		async (
			credential: PublicKeyCredential,
			prfSalt: Uint8Array,
			promptForPrfRetry: () => Promise<boolean | AbortSignal>,
			user: UserData,
		): Promise<EncryptedContainer> => {
			const { mainKey, keyInfo } = await keystore.initPrf(credential, prfSalt, promptForPrfRetry);
			const result = await init(mainKey, keyInfo, user);
			return result;
		},
		[init]
	);

	const initPassword = useCallback(
		async (password: string): Promise<[EncryptedContainer, (userHandleB64u: string) => void]> => {
			const { mainKey, keyInfo } = await keystore.initPassword(password);
			return [await init(mainKey, keyInfo, null), setUserHandleB64u];
		},
		[init, setUserHandleB64u]
	);

	const getPrfKeyInfo = useCallback(
		(id: BufferSource): WebauthnPrfEncryptionKeyInfo | undefined => {
			return privateData?.prfKeys.find(({ credentialId }) => toBase64Url(credentialId) === toBase64Url(id));
		},
		[privateData]
	);


	const getCachedUsers = useCallback((): CachedUser[] => {
		return [...(cachedUsers || [])];
	}, [cachedUsers]);

	const forgetCachedUser = useCallback((user: CachedUser): void => {
		setCachedUsers((cachedUsers) => cachedUsers.filter((cu) => cu.userHandleB64u !== user.userHandleB64u));
	}, [setCachedUsers]);

	const getUserHandleB64u = useCallback((): string | null => {
		return (userHandleB64u);
	}, [userHandleB64u]);


	const addPrf = useCallback(
		async (
			credential: PublicKeyCredential,
			promptForPrfRetry: () => Promise<boolean | AbortSignal>,
		): Promise<[EncryptedContainer, CommitCallback]> => {
			const [privateData, mainKey] = await assertKeystoreOpen();
			const newPrivateData = await keystore.addPrf(privateData, credential, mainKey, promptForPrfRetry);
			return [
				newPrivateData,
				async () => {
					await writePrivateDataOnIdb(newPrivateData, userHandleB64u);
					setPrivateData(newPrivateData);
				},
			];
		},
		[setPrivateData, writePrivateDataOnIdb, userHandleB64u, assertKeystoreOpen]
	);

	const deletePrf = useCallback(
		(credentialId: Uint8Array): [EncryptedContainer, CommitCallback] => {
			const newPrivateData = keystore.deletePrf(privateData, credentialId);
			return [
				newPrivateData,
				async () => {
					await writePrivateDataOnIdb(newPrivateData, userHandleB64u);
					setPrivateData(newPrivateData);
				},
			];
		},
		[privateData, setPrivateData, writePrivateDataOnIdb, userHandleB64u]
	);

	const unlockPrf = useCallback(
		async (
			encryptedPrivateData: EncryptedContainer,
			credential: PublicKeyCredential,
			promptForPrfRetry: () => Promise<boolean | AbortSignal>,
			user: CachedUser | UserData | null,
		): Promise<[EncryptedContainer, CommitCallback] | null> => {
			const [unlockPrfResult,] = await keystore.unlockPrf(encryptedPrivateData, credential, promptForPrfRetry);
			const updatedPrivateData = await finishUnlock(unlockPrfResult, user, credential, promptForPrfRetry);
			return (
				updatedPrivateData
					?
					[updatedPrivateData,
						async () => {

						},
					]
					: null
			);
		},
		[finishUnlock]
	);

	const getPasswordOrPrfKeyFromSession = useCallback(
		async (
			promptForPassword: () => Promise<string | null>,
			promptForPrfRetry: () => Promise<boolean | AbortSignal>,
		): Promise<[CryptoKey, WrappedKeyInfo]> => {
			if (privateData && privateData?.prfKeys?.length > 0) {
				const [prfKey, prfKeyInfo,] = await keystore.getPrfKey(privateData, null, promptForPrfRetry);
				return [prfKey, keystore.isPrfKeyV2(prfKeyInfo) ? prfKeyInfo : prfKeyInfo.mainKey];

			} else if (privateData && privateData?.passwordKey) {
				const password = await promptForPassword();
				if (password === null) {
					throw new Error("Password prompt aborted");
				} else {
					try {
						const [passwordKey, passwordKeyInfo] = await keystore.getPasswordKey(privateData, password);
						return [passwordKey, keystore.isAsymmetricPasswordKeyInfo(passwordKeyInfo) ? passwordKeyInfo : passwordKeyInfo.mainKey];
					} catch {
						throw new Error("Failed to unlock key store", { cause: { errorId: "passwordUnlockFailed" } });
					}
				}

			} else {
				throw new Error("Session not initialized");
			}
		},
		[privateData]
	);

	const upgradePrfKey = useCallback(
		async (
			prfKeyInfo: WebauthnPrfEncryptionKeyInfo,
			promptForPrfRetry: () => Promise<boolean | AbortSignal>,
		): Promise<[EncryptedContainer, CommitCallback]> => {
			if (keystore.isPrfKeyV2(prfKeyInfo)) {
				throw new Error("Key is already upgraded");

			} else if (privateData) {
				const newPrivateData = await keystore.upgradePrfKey(privateData, null, prfKeyInfo, promptForPrfRetry);
				return [
					newPrivateData,
					async () => {
						await writePrivateDataOnIdb(newPrivateData, userHandleB64u);
						setPrivateData(newPrivateData);
					},
				];

			} else {
				throw new Error("Session not initialized");
			}
		},
		[privateData, setPrivateData, writePrivateDataOnIdb, userHandleB64u]
	);

	const signJwtPresentation = useCallback(
		async (nonce: string, audience: string, verifiableCredentials: any[], transactionDataResponseParams?: { transaction_data_hashes: string[], transaction_data_hashes_alg: string[] }): Promise<{ vpjwt: string }> => (
			await keystore.signJwtPresentation(await openPrivateData(), nonce, audience, verifiableCredentials, transactionDataResponseParams)
		),
		[openPrivateData]
	);

	const generateDeviceResponse = useCallback(
		async (mdocCredential: MDoc, presentationDefinition: any, mdocGeneratedNonce: string, verifierGeneratedNonce: string, clientId: string, responseUri: string): Promise<{ deviceResponseMDoc: MDoc }> => (
			await keystore.generateDeviceResponse(await openPrivateData(), mdocCredential, presentationDefinition, mdocGeneratedNonce, verifierGeneratedNonce, clientId, responseUri)
		),
		[openPrivateData]
	);

	const generateDeviceResponseWithProximity = useCallback(
		async (mdocCredential: MDoc, presentationDefinition: any, sessionTranscriptBytes: any): Promise<{ deviceResponseMDoc: MDoc }> => (
			await keystore.generateDeviceResponseWithProximity(await openPrivateData(), mdocCredential, presentationDefinition, sessionTranscriptBytes)
		),
		[openPrivateData]
	);

	const isOpen = useCallback((): boolean => {
		return privateData !== null && mainKey !== null;
	}, [privateData, mainKey]);

	const generateOpenid4vciProofs = useCallback(async (requests: { nonce: string, audience: string, issuer: string }[]): Promise<[
		{ proof_jwts: string[] },
		AsymmetricEncryptedContainer,
		CommitCallback,
	]> => (
		await editPrivateData(async (originalContainer) => {
			const { nonce, audience, issuer } = requests[0]; // the first row is enough since the nonce remains the same
			return await keystore.generateOpenid4vciProofs(
				originalContainer,
				config.DID_KEY_VERSION,
				nonce,
				audience,
				issuer,
				requests.length
			);
		})
	), [editPrivateData]);

	const generateKeypairs = useCallback(
		async (n: number): Promise<[
			{ keypairs: keystore.CredentialKeyPair[] },
			AsymmetricEncryptedContainer,
			CommitCallback,
		]> => (
			await editPrivateData(async (originalContainer) => {
				return await keystore.generateKeypairs(
					originalContainer,
					config.DID_KEY_VERSION,
					n
				);
			})
		),
		[editPrivateData]
	);


	const getCalculatedWalletState = useCallback((): WalletState | null => {
		return (calculatedWalletState);
	}, [calculatedWalletState]);

	const addCredentials = useCallback(async (credentials: { data: string, format: string, kid: string, batchId: number, credentialIssuerIdentifier: string, credentialConfigurationId: string, instanceId: number, credentialId?: number, }[]): Promise<[
		{},
		AsymmetricEncryptedContainer,
		CommitCallback,
	]> => {
		let [walletStateContainer, ,] = await openPrivateData();
		walletStateContainer = await foldOldEventsIntoBaseState(walletStateContainer);

		for (const { data, format, batchId, credentialIssuerIdentifier, kid, credentialConfigurationId, instanceId, credentialId } of credentials) {
			walletStateContainer = await addNewCredentialEvent(walletStateContainer, data, format, kid, batchId, credentialIssuerIdentifier, credentialConfigurationId, instanceId, credentialId);
		}

		return editPrivateData(async (originalContainer) => {
			const { newContainer } = await keystore.updateWalletState(originalContainer, walletStateContainer);
			return [{}, newContainer];
		})
	}, [editPrivateData, openPrivateData])


	const getAllCredentials = useCallback(async (): Promise<WalletStateCredential[] | null> => {
		return calculatedWalletState ? calculatedWalletState.credentials : null;
	}, [calculatedWalletState]);


	const deleteCredentialsByBatchId = useCallback(async (batchId: number): Promise<[
		{},
		AsymmetricEncryptedContainer,
		CommitCallback,
	]> => {
		let [walletStateContainer, ,] = await openPrivateData();
		walletStateContainer = await foldOldEventsIntoBaseState(walletStateContainer);

		const credentialsToBeDeleted = calculatedWalletState.credentials.filter((cred) => cred.batchId === batchId);
		for (const cred of credentialsToBeDeleted) {
			walletStateContainer = await addDeleteCredentialEvent(walletStateContainer, cred.credentialId);
			// delete keypair
			const kid = calculatedWalletState.credentials.filter((c) => c.credentialId === cred.credentialId).map((c) => c.kid)[0];
			if (kid) {
				walletStateContainer = await addDeleteKeypairEvent(walletStateContainer, kid);
			}
		}

		return editPrivateData(async (originalContainer) => {
			const { newContainer } = await keystore.updateWalletState(originalContainer, walletStateContainer);
			return [{}, newContainer];
		});

	}, [editPrivateData, openPrivateData, calculatedWalletState]);


	const addPresentations = useCallback(async (presentations: { transactionId: number, data: string, usedCredentialIds: number[], audience: string, }[]): Promise<[
		{},
		AsymmetricEncryptedContainer,
		CommitCallback,
	]> => {
		let [walletStateContainer, ,] = await openPrivateData();
		walletStateContainer = await foldOldEventsIntoBaseState(walletStateContainer);

		for (const { transactionId, data, usedCredentialIds, audience } of presentations) {
			walletStateContainer = await addNewPresentationEvent(walletStateContainer,
				transactionId,
				data,
				usedCredentialIds,
				Math.floor(new Date().getTime() / 1000),
				audience
			);
		}

		return editPrivateData(async (originalContainer) => {
			const { newContainer } = await keystore.updateWalletState(originalContainer, walletStateContainer);
			return [{}, newContainer];
		})
	}, [editPrivateData, openPrivateData])
	const getAllPresentations = useCallback(async (): Promise<WalletStatePresentation[] | null> => {
		return calculatedWalletState ? calculatedWalletState.presentations : null;
	}, [calculatedWalletState]);


	const saveCredentialIssuanceSessions = useCallback(async (newIssuanceSessions: WalletStateCredentialIssuanceSession[], deletedSessions: number[] = []): Promise<[
		{},
		AsymmetricEncryptedContainer,
		CommitCallback,
	]> => {
		let [walletStateContainer, ,] = await openPrivateData();
		walletStateContainer = await foldOldEventsIntoBaseState(walletStateContainer);

		for (const issuanceSession of newIssuanceSessions) {
			walletStateContainer = await addSaveCredentialIssuanceSessionEvent(walletStateContainer,
				issuanceSession.sessionId,
				issuanceSession.credentialIssuerIdentifier,
				issuanceSession.state,
				issuanceSession.code_verifier,
				issuanceSession.credentialConfigurationId,
				issuanceSession.tokenResponse,
				issuanceSession.dpop,
				issuanceSession.firstPartyAuthorization,
				issuanceSession.credentialEndpoint,
				issuanceSession.created,
			);
		}
		for (const sessionId of deletedSessions) {
			walletStateContainer = await addDeleteCredentialIssuanceSessionEvent(walletStateContainer, sessionId);
		}

		return editPrivateData(async (originalContainer) => {
			const { newContainer } = await keystore.updateWalletState(originalContainer, walletStateContainer);
			return [{}, newContainer];
		});
	}, [editPrivateData, openPrivateData]);

	const getCredentialIssuanceSessionByState = useCallback(async (state: string): Promise<WalletStateCredentialIssuanceSession | null> => {
		return calculatedWalletState ? calculatedWalletState.credentialIssuanceSessions.filter((s: WalletStateCredentialIssuanceSession) => s.state === state)[0] : null;
	}, [calculatedWalletState]);

	const alterSettings = useCallback(async (settings: WalletStateSettings): Promise<[
		{},
		AsymmetricEncryptedContainer,
		CommitCallback,
	]> => {
		let [walletStateContainer, ,] = await openPrivateData();
		walletStateContainer = await foldOldEventsIntoBaseState(walletStateContainer);
		walletStateContainer = await addAlterSettingsEvent(walletStateContainer, settings);

		return editPrivateData(async (originalContainer) => {
			const { newContainer } = await keystore.updateWalletState(originalContainer, walletStateContainer);
			return [{}, newContainer];
		});
	}, [editPrivateData, openPrivateData]);


	return useMemo(() => ({
		isOpen,
		close,
		initPassword,
		initPrf,
		addPrf,
		deletePrf,
		unlockPassword,
		unlockPrf,
		getPrfKeyInfo,
		getPasswordOrPrfKeyFromSession,
		upgradePrfKey,
		getCachedUsers,
		forgetCachedUser,
		getUserHandleB64u,
		signJwtPresentation,
		generateOpenid4vciProofs,
		generateKeypairs,
		generateDeviceResponse,
		generateDeviceResponseWithProximity,
		getCalculatedWalletState,
		getAllCredentials,
		addCredentials,
		deleteCredentialsByBatchId,
		addPresentations,
		getAllPresentations,
		saveCredentialIssuanceSessions,
		getCredentialIssuanceSessionByState,
		alterSettings,
	}), [
		isOpen,
		close,
		initPassword,
		initPrf,
		addPrf,
		deletePrf,
		unlockPassword,
		unlockPrf,
		getPrfKeyInfo,
		getPasswordOrPrfKeyFromSession,
		upgradePrfKey,
		getCachedUsers,
		forgetCachedUser,
		getUserHandleB64u,
		signJwtPresentation,
		generateOpenid4vciProofs,
		generateKeypairs,
		generateDeviceResponse,
		generateDeviceResponseWithProximity,
		getCalculatedWalletState,
		getAllCredentials,
		addCredentials,
		deleteCredentialsByBatchId,
		addPresentations,
		getAllPresentations,
		saveCredentialIssuanceSessions,
		getCredentialIssuanceSessionByState,
		alterSettings,
	]);
}
