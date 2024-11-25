import { useCallback, useEffect } from "react";

import * as config from "../config";
import { useClearStorages, useLocalStorage, useSessionStorage } from "../hooks/useStorage";
import { toBase64Url } from "../util";
import { useIndexedDb } from "../hooks/useIndexedDb";
import { useOnUserInactivity } from "../hooks/useOnUserInactivity";

import * as keystore from "./keystore";
import type { AsymmetricEncryptedContainer, AsymmetricEncryptedContainerKeys, EncryptedContainer, OpenedContainer, PrivateData, UnlockSuccess, WebauthnPrfEncryptionKeyInfo, WebauthnPrfSaltInfo, WrappedKeyInfo } from "./keystore";


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

	initPassword(password: string): Promise<[EncryptedContainer, (userHandleB64u: string) => void]>,
	initPrf(
		credential: PublicKeyCredential,
		prfSalt: Uint8Array,
		promptForPrfRetry: () => Promise<boolean | AbortSignal>,
		user: UserData,
	): Promise<EncryptedContainer>,
	addPrf(
		credential: PublicKeyCredential,
		[existingUnwrapKey, wrappedMainKey]: [CryptoKey, WrappedKeyInfo],
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

	signJwtPresentation(nonce: string, audience: string, verifiableCredentials: any[]): Promise<{ vpjwt: string }>,
	generateOpenid4vciProofs(requests: { nonce: string, audience: string, issuer: string }[]): Promise<[
		{ proof_jwts: string[] },
		AsymmetricEncryptedContainer,
		CommitCallback,
	]>,
}

/** A stateful wrapper around the keystore module, storing state in the browser's localStorage and sessionStorage. */
export function useLocalStorageKeystore(): LocalStorageKeystore {
	const [cachedUsers, setCachedUsers,] = useLocalStorage<CachedUser[]>("cachedUsers", []);
	const [privateData, setPrivateData, clearPrivateData] = useLocalStorage<EncryptedContainer | null>("privateData", null);
	const [globalUserHandleB64u, setGlobalUserHandleB64u, clearGlobalUserHandleB64u] = useLocalStorage<string | null>("userHandle", null);

	const [userHandleB64u, setUserHandleB64u, clearUserHandleB64u] = useSessionStorage<string | null>("userHandle", null);
	const [mainKey, setMainKey, clearMainKey] = useSessionStorage<BufferSource | null>("mainKey", null);
	const clearSessionStorage = useClearStorages(clearUserHandleB64u, clearMainKey);

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
			clearPrivateData();
			clearGlobalUserHandleB64u();
			closeTabLocal();
		},
		[closeTabLocal, idb, clearGlobalUserHandleB64u, clearPrivateData],
	);

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

			} else if (!privateData) {
				// When user logs out in any tab, log out in all tabs
				closeTabLocal();

			} else if (userHandleB64u && globalUserHandleB64u && (userHandleB64u !== globalUserHandleB64u)) {
				// When user logs in in any tab, log out in all other tabs
				// that are logged in to a different account
				closeTabLocal();
			}
		},
		[close, closeTabLocal, privateData, userHandleB64u, globalUserHandleB64u, setCachedUsers],
	);

	const openPrivateData = async (): Promise<[PrivateData, CryptoKey]> => {
		if (mainKey && privateData) {
			return await keystore.openPrivateData(mainKey, privateData)
		} else {
			throw new Error("Private data not present in storage.");
		}
	};

	const editPrivateData = async <T>(
		action: (container: OpenedContainer) => Promise<[T, OpenedContainer]>,
	): Promise<[T, AsymmetricEncryptedContainer, CommitCallback]> => {
		if (mainKey && privateData) {
			const [result, [newPrivateData, newMainKey]] = await action(
				[
					keystore.assertAsymmetricEncryptedContainer(privateData),
					await keystore.importMainKey(mainKey),
				],
			);
			return [
				result,
				newPrivateData,
				async () => {
					setPrivateData(newPrivateData);
					setMainKey(await keystore.exportMainKey(newMainKey));
				},
			];
		} else {
			throw new Error("Private data not present in storage.");
		}
	};

	const finishUnlock = async (
		{ exportedMainKey, privateData }: UnlockSuccess,
		user: CachedUser | UserData | null,
	): Promise<void> => {
		setMainKey(exportedMainKey);
		setPrivateData(privateData);

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
		mainKey: CryptoKey,
		keyInfo: AsymmetricEncryptedContainerKeys,
		user: UserData,
	): Promise<EncryptedContainer> => {
		const unlocked = await keystore.init(mainKey, keyInfo);
		await finishUnlock(unlocked, user);
		const { privateData } = unlocked;
		return privateData;
	};

	return {
		isOpen: (): boolean => privateData !== null && mainKey !== null,
		close,

		initPassword: async (password: string): Promise<[EncryptedContainer, (userHandleB64u: string) => void]> => {
			const { mainKey, keyInfo } = await keystore.initPassword(password);
			return [await init(mainKey, keyInfo, null), setUserHandleB64u];
		},

		initPrf: async (
			credential: PublicKeyCredential,
			prfSalt: Uint8Array,
			promptForPrfRetry: () => Promise<boolean | AbortSignal>,
			user: UserData,
		): Promise<EncryptedContainer> => {
			const { mainKey, keyInfo } = await keystore.initPrf(credential, prfSalt, promptForPrfRetry);
			const result = await init(mainKey, keyInfo, user);
			return result;
		},

		addPrf: async (
			credential: PublicKeyCredential,
			[existingUnwrapKey, wrappedMainKey]: [CryptoKey, WrappedKeyInfo],
			promptForPrfRetry: () => Promise<boolean | AbortSignal>,
		): Promise<[EncryptedContainer, CommitCallback]> => {
			const newPrivateData = await keystore.addPrf(privateData, credential, [existingUnwrapKey, wrappedMainKey], promptForPrfRetry);
			return [
				newPrivateData,
				async () => {
					setPrivateData(newPrivateData);
				},
			];
		},

		deletePrf: (credentialId: Uint8Array): [EncryptedContainer, CommitCallback] => {
			const newPrivateData = keystore.deletePrf(privateData, credentialId);
			return [
				newPrivateData,
				async () => {
					setPrivateData(newPrivateData);
				},
			];
		},

		unlockPassword: async (
			privateData: EncryptedContainer,
			password: string,
			user: UserData,
		): Promise<[EncryptedContainer, CommitCallback] | null> => {
			const [unlockResult, newPrivateData] = await keystore.unlockPassword(privateData, password);
			await finishUnlock(unlockResult, user);
			return (
				newPrivateData
					?
					[newPrivateData,
						async () => {
							setPrivateData(newPrivateData);
						},
					]
					: null
			);
		},

		unlockPrf: async (
			privateData: EncryptedContainer,
			credential: PublicKeyCredential,
			promptForPrfRetry: () => Promise<boolean | AbortSignal>,
			user: CachedUser | UserData | null,
		): Promise<[EncryptedContainer, CommitCallback] | null> => {
			const [unlockPrfResult, newPrivateData] = await keystore.unlockPrf(privateData, credential, promptForPrfRetry);
			await finishUnlock(unlockPrfResult, user);
			return (
				newPrivateData
					?
					[newPrivateData,
						async () => {
							setPrivateData(newPrivateData);
						},
					]
					: null
			);
		},

		getPrfKeyInfo: (id: BufferSource): WebauthnPrfEncryptionKeyInfo | undefined => {
			return privateData?.prfKeys.find(({ credentialId }) => toBase64Url(credentialId) === toBase64Url(id));
		},

		getPasswordOrPrfKeyFromSession: async (
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

		upgradePrfKey: async (
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
						setPrivateData(newPrivateData);
					},
				];

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

		getUserHandleB64u: (): string | null => {
			return (userHandleB64u);
		},

		signJwtPresentation: async (nonce: string, audience: string, verifiableCredentials: any[]): Promise<{ vpjwt: string }> => (
			await keystore.signJwtPresentation(await openPrivateData(), nonce, audience, verifiableCredentials)
		),

		generateOpenid4vciProofs: async (requests: { nonce: string, audience: string, issuer: string }[]): Promise<[
			{ proof_jwts: string[] },
			AsymmetricEncryptedContainer,
			CommitCallback,
		]> => (
			await editPrivateData(async (originalContainer) => {
				const { nonce, audience, issuer } = requests[0]; // the first row is enough since the nonce remains the same
				const [{ proof_jwts }, newContainer] = await keystore.generateOpenid4vciProofs(
					originalContainer,
					config.DID_KEY_VERSION,
					nonce,
					audience,
					issuer,
					requests.length
				);
				return [{ proof_jwts }, newContainer];
			})
		),
	};
}
