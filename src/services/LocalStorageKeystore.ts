import { useCallback, useEffect, useMemo } from "react";

import { useClearStorages, useLocalStorage, useSessionStorage } from "../components/useStorage";
import { toBase64Url } from "../util";
import { useIndexedDb } from "../components/useIndexedDb";

import * as keystore from "./keystore";
import { EncryptedContainer, EncryptedContainerKeys, PrivateData, PublicData, UnlockSuccess, WebauthnPrfEncryptionKeyInfo, WebauthnPrfSaltInfo, WrappedKeyInfo, getPrfKey } from "./keystore";


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

export type CommitCallback = () => Promise<void>;
export interface LocalStorageKeystore {
	isOpen(): boolean,
	close(): Promise<void>,

	initPassword(password: string): Promise<{ publicData: PublicData, privateData: EncryptedContainer }>,
	initPrf(
		credential: PublicKeyCredential,
		prfSalt: Uint8Array,
		rpId: string,
		promptForPrfRetry: () => Promise<boolean>,
		user: UserData,
	): Promise<{ publicData: PublicData, privateData: EncryptedContainer }>,
	addPrf(
		credential: PublicKeyCredential,
		rpId: string,
		existingPrfKey: CryptoKey,
		wrappedMainKey: WrappedKeyInfo,
		promptForPrfRetry: () => Promise<boolean>,
	): Promise<[EncryptedContainer, CommitCallback]>,
	deletePrf(credentialId: Uint8Array): [EncryptedContainer, CommitCallback],
	unlockPassword(privateData: EncryptedContainer, password: string): Promise<void>,
	unlockPrf(
		privateData: EncryptedContainer,
		credential: PublicKeyCredential,
		rpId: string,
		promptForPrfRetry: () => Promise<boolean>,
		user: CachedUser | UserData,
	): Promise<void>,
	getPrfKeyFromSession(promptForPrfRetry: () => Promise<boolean>): Promise<[CryptoKey, WebauthnPrfEncryptionKeyInfo]>,
	getCachedUsers(): CachedUser[],
	forgetCachedUser(user: CachedUser): void,

	createIdToken(nonce: string, audience: string): Promise<{ id_token: string; }>,
	signJwtPresentation(nonce: string, audience: string, verifiableCredentials: any[]): Promise<{ vpjwt: string }>,
	generateOpenid4vciProof(nonce: string, audience: string): Promise<{ proof_jwt: string }>,
}

/** A stateful wrapper around the keystore module, storing state in the browser's localStorage and sessionStorage. */
export function useLocalStorageKeystore(): LocalStorageKeystore {
	const [cachedUsers, setCachedUsers,] = useLocalStorage<CachedUser[]>("cachedUsers", []);
	const [privateDataCache, setPrivateDataCache, clearPrivateDataCache] = useLocalStorage<EncryptedContainer | null>("privateData", null);
	const [globalUserHandleB64u, setGlobalUserHandleB64u, clearGlobalUserHandleB64u] = useLocalStorage<string | null>("userHandle", null);

	const [userHandleB64u, setUserHandleB64u, clearUserHandleB64u] = useSessionStorage<string | null>("userHandle", null);
	const [webauthnRpId, setWebauthnRpId, clearWebauthnRpId] = useSessionStorage<string | null>("webauthnRpId", null);
	const [sessionKey, setSessionKey, clearSessionKey] = useSessionStorage<BufferSource | null>("sessionKey", null);
	const [privateDataJwe, setPrivateDataJwe, clearPrivateDataJwe] = useSessionStorage<string | null>("privateDataJwe", null);
	const clearSessionStorage = useClearStorages(clearUserHandleB64u, clearWebauthnRpId, clearSessionKey, clearPrivateDataJwe);

	useEffect(() => {
		// Moved from local storage to session storage
		window?.localStorage?.removeItem("userHandle");
		window?.localStorage?.removeItem("webauthnRpId");
	}, []);

	const idb = useIndexedDb("wallet-frontend", 2, useCallback((db, prevVersion, newVersion) => {
		if (prevVersion < 1) {
			const objectStore = db.createObjectStore("keys", { keyPath: "id" });
			objectStore.createIndex("id", "id", { unique: true });
		}
		if (prevVersion < 2) {
			db.deleteObjectStore("keys");
		}
	}, []));

	const closeTabLocal = useCallback(
		() => {
			clearSessionStorage();
		},
		[clearSessionStorage],
	);

	const close = useCallback(
		async (): Promise<void> => {
			await idb.destroy();
			clearPrivateDataCache();
			clearGlobalUserHandleB64u();
			closeTabLocal();
		},
		[closeTabLocal, idb, clearGlobalUserHandleB64u, clearPrivateDataCache],
	);

	useEffect(
		() => {
			if (privateDataCache && userHandleB64u && (userHandleB64u === globalUserHandleB64u)) {
				// When PRF keys are added, deleted or edited in any tab,
				// propagate changes to cached users
				setCachedUsers((cachedUsers) => cachedUsers.map((cu) => {
					if (cu.userHandleB64u === userHandleB64u) {
						return {
							...cu,
							prfKeys: privateDataCache.prfKeys.map((keyInfo) => ({
								credentialId: keyInfo.credentialId,
								prfSalt: keyInfo.prfSalt,
							})),
						};
					} else {
						return cu;
					}
				}));

			} else if (!privateDataCache) {
				// When user logs out in any tab, log out in all tabs
				closeTabLocal();

			} else if (userHandleB64u && globalUserHandleB64u && (userHandleB64u !== globalUserHandleB64u)) {
				console.log("useEffect userHandle");

				// When user logs in in any tab, log out in all other tabs
				// that are logged in to a different account
				closeTabLocal();
			}
		},
		[close, closeTabLocal, privateDataCache, userHandleB64u, globalUserHandleB64u, setCachedUsers],
	);

	return useMemo(
		() => {
			const openPrivateData = async (): Promise<[PrivateData, CryptoKey]> => {
				if (privateDataJwe) {
					return await keystore.openPrivateData(sessionKey, privateDataJwe);
				} else {
					throw new Error("Private data not present in storage.");
				}
			};

			const finishUnlock = async (
				{ exportedSessionKey, privateDataCache, privateDataJwe }: UnlockSuccess,
				user: CachedUser | UserData | null,
			): Promise<void> => {
				setSessionKey(exportedSessionKey);
				setPrivateDataCache(privateDataCache);
				setPrivateDataJwe(privateDataJwe);

				if (user) {
					const userHandleB64u = ("prfKeys" in user
						? user.userHandleB64u
						: toBase64Url(user.userHandle)
					);
					const newUser = ("prfKeys" in user
						? user
						: {
							displayName: user.displayName,
							userHandleB64u,
							prfKeys: [], // Placeholder - will be updated by useEffect above
						}
					);

					setUserHandleB64u(userHandleB64u);
					setGlobalUserHandleB64u(userHandleB64u);
					setCachedUsers((cachedUsers) => {
						// Move most recently used user to front of list
						const otherUsers = (cachedUsers || []).filter((cu) => cu.userHandleB64u !== newUser.userHandleB64u);
						return [newUser, ...otherUsers];
					});
				}
			};

			const init = async (
				wrappedMainKey: WrappedKeyInfo,
				wrappingKey: CryptoKey,
				keyInfo: EncryptedContainerKeys,
				user: UserData,
			): Promise<{ publicData: PublicData, privateData: EncryptedContainer }> => {
				console.log("init");

				const { mainKey, publicData, privateData } = await keystore.init(wrappedMainKey, wrappingKey, keyInfo);
				await finishUnlock(await keystore.unlock(mainKey, privateData), user);

				return {
					publicData,
					privateData,
				};
			};

			return {
				isOpen: () => {
					return privateDataJwe !== null && sessionKey !== null;
				},
				close,

				initPassword: async (password: string): Promise<{ publicData: PublicData, privateData: EncryptedContainer }> => {
					console.log("initPassword");
					const [wrappedMainKey, wrappingKey, keys] = await keystore.initPassword(password);
					return await init(wrappedMainKey, wrappingKey, keys, null);
				},

				initPrf: async (
					credential: PublicKeyCredential,
					prfSalt: Uint8Array,
					rpId: string,
					promptForPrfRetry: () => Promise<boolean>,
					user: UserData,
				): Promise<{ publicData: PublicData, privateData: EncryptedContainer }> => {
					console.log("initPrf");
					const [wrappedMainKey, wrappingKey, keys] = await keystore.initPrf(credential, prfSalt, rpId, promptForPrfRetry);
					const result = await init(wrappedMainKey, wrappingKey, keys, user);
					setWebauthnRpId(rpId);
					return result;
				},

				addPrf: async (
					credential: PublicKeyCredential,
					rpId: string,
					existingPrfKey: CryptoKey,
					wrappedMainKey: WrappedKeyInfo,
					promptForPrfRetry: () => Promise<boolean>,
				): Promise<[EncryptedContainer, CommitCallback]> => {
					const newPrivateData = await keystore.addPrf(privateDataCache, credential, rpId, existingPrfKey, wrappedMainKey, promptForPrfRetry);
					return [
						newPrivateData,
						async () => {
							setPrivateDataCache(newPrivateData);
						},
					];
				},

				deletePrf: (credentialId: Uint8Array): [EncryptedContainer, CommitCallback] => {
					const newPrivateData = keystore.deletePrf(privateDataCache, credentialId);
					return [
						newPrivateData,
						async () => {
							setPrivateDataCache(newPrivateData);
						},
					];
				},

				unlockPassword: async (privateData: EncryptedContainer, password: string): Promise<void> => {
					return await finishUnlock(await keystore.unlockPassword(privateData, password), null);
				},

				unlockPrf: async (
					privateData: EncryptedContainer,
					credential: PublicKeyCredential,
					rpId: string,
					promptForPrfRetry: () => Promise<boolean>,
					user: CachedUser | UserData | null,
				): Promise<void> => {
					const result = await finishUnlock(await keystore.unlockPrf(privateData, credential, rpId, promptForPrfRetry), user);
					setWebauthnRpId(rpId);
					return result;
				},

				getPrfKeyFromSession: async (
					promptForPrfRetry: () => Promise<boolean>,
				): Promise<[CryptoKey, WebauthnPrfEncryptionKeyInfo]> => {
					if (privateDataCache && webauthnRpId) {
						return await getPrfKey(privateDataCache, null, webauthnRpId, promptForPrfRetry);

					} else {
						throw new Error("Session not initialized");
					}
				},

				getCachedUsers: (): CachedUser[] => {
					return [...(cachedUsers || [])];
				},

				forgetCachedUser: (user: CachedUser): void => {
					setCachedUsers((cachedUsers) => cachedUsers.filter((cu) => cu.userHandleB64u !== user.userHandleB64u));
				},

				createIdToken: async (nonce: string, audience: string): Promise<{ id_token: string; }> => (
					await keystore.createIdToken(await openPrivateData(), nonce, audience)
				),

				signJwtPresentation: async (nonce: string, audience: string, verifiableCredentials: any[]): Promise<{ vpjwt: string }> => (
					await keystore.signJwtPresentation(await openPrivateData(), nonce, audience, verifiableCredentials)
				),

				generateOpenid4vciProof: async (nonce: string, audience: string): Promise<{ proof_jwt: string }> => (
					await keystore.generateOpenid4vciProof(await openPrivateData(), nonce, audience)
				),
			};
		},
		[
			cachedUsers,
			close,
			privateDataCache,
			privateDataJwe,
			sessionKey,
			setCachedUsers,
			setGlobalUserHandleB64u,
			setPrivateDataCache,
			setPrivateDataJwe,
			setSessionKey,
			setUserHandleB64u,
			setWebauthnRpId,
			webauthnRpId,
		],
	);
}
