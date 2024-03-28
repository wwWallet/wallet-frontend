import { useCallback, useEffect, useMemo } from "react";
import * as jose from "jose";
import { SignJWT } from "jose";
import { v4 as uuidv4 } from "uuid";
import { SignVerifiablePresentationJWT } from "@wwwallet/ssi-sdk";

import { verifiablePresentationSchemaURL } from "../constants";
import { useClearStorages, useLocalStorage, useSessionStorage } from "../components/useStorage";
import { jsonParseTaggedBinary, toBase64Url } from "../util";
import { useIndexedDb } from "../components/useIndexedDb";

import { CachedUser, EncryptedContainer, PasswordKeyInfo, PrivateData, PublicData, UserData, WebauthnPrfEncryptionKeyInfo, WrappedKeyInfo, createMainKey, createPrfKey, createSessionKey, createWallet, derivePasswordKey, getPrfKey, importSessionKey, pbkdfHash, pbkdfIterations, reencryptPrivateData, unwrapKey, unwrapPrivateKey } from "./keystore";


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
	unlockPassword(privateData: EncryptedContainer, password: string, keyInfo: PasswordKeyInfo): Promise<void>,
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
					const sessk = await importSessionKey(sessionKey);
					const privateData = jsonParseTaggedBinary(
						new TextDecoder().decode(
							(await jose.compactDecrypt(privateDataJwe, sessk)).plaintext
						));
					return [privateData, sessk];
				} else {
					throw new Error("Private data not present in storage.");
				}
			};

			const unlock = async (mainKey: CryptoKey, privateData: EncryptedContainer, user: CachedUser | UserData): Promise<void> => {
				const [sessionKey, exportedSessionKey] = await createSessionKey();
				setSessionKey(exportedSessionKey);
				const reencryptedPrivateData = await reencryptPrivateData(privateData.jwe, mainKey, sessionKey);
				setPrivateDataCache(privateData);
				setPrivateDataJwe(reencryptedPrivateData);

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

			const unlockPassword = async (privateData: EncryptedContainer, password: string, keyInfo: PasswordKeyInfo): Promise<void> => {
				const passwordKey = await derivePasswordKey(password, keyInfo.pbkdf2Params);
				const mainKey = await unwrapKey(passwordKey, keyInfo.mainKey);
				return await unlock(mainKey, privateData, null);
			};

			const unlockPrf = async (
				privateData: EncryptedContainer,
				credential: PublicKeyCredential,
				rpId: string,
				promptForPrfRetry: () => Promise<boolean>,
				user: CachedUser | UserData | null,
			): Promise<void> => {
				const [prfKey, keyInfo] = await getPrfKey(privateData, credential, rpId, promptForPrfRetry);
				const mainKey = await unwrapKey(prfKey, keyInfo.mainKey);
				const result = await unlock(mainKey, privateData, user);
				setWebauthnRpId(rpId);
				return result;
			};

			const init = async (
				wrappedMainKey: WrappedKeyInfo,
				wrappingKey: CryptoKey,
				keyInfo: { passwordKey?: PasswordKeyInfo, prfKeys: WebauthnPrfEncryptionKeyInfo[] },
				user: UserData,
			): Promise<{ publicData: PublicData, privateData: EncryptedContainer }> => {
				console.log("init");

				const mainKey = await unwrapKey(wrappingKey, wrappedMainKey);

				const { publicData, privateDataJwe } = await createWallet(mainKey);
				const privateData: EncryptedContainer = {
					...keyInfo,
					jwe: privateDataJwe,
				};
				await unlock(mainKey, privateData, user);

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

					const pbkdf2Params: Pbkdf2Params = {
						name: "PBKDF2",
						hash: pbkdfHash,
						iterations: pbkdfIterations,
						salt: crypto.getRandomValues(new Uint8Array(32)),
					};
					const passwordKey = await derivePasswordKey(password, pbkdf2Params);
					const wrappedMainKey = await createMainKey(passwordKey);
					const passwordKeyInfo = {
						mainKey: wrappedMainKey,
						pbkdf2Params,
						prfKeys: [],
					};

					return await init(wrappedMainKey, passwordKey, { passwordKey: passwordKeyInfo, prfKeys:[] }, null);
				},

				initPrf: async (
					credential: PublicKeyCredential,
					prfSalt: Uint8Array,
					rpId: string,
					promptForPrfRetry: () => Promise<boolean>,
					user: UserData,
				): Promise<{ publicData: PublicData, privateData: EncryptedContainer }> => {
					console.log("initPrf");
					const [prfKey, keyInfo] = await createPrfKey(credential, prfSalt, rpId, null, null, promptForPrfRetry);
					const result = await init(keyInfo.mainKey, prfKey, { prfKeys: [keyInfo] }, user);
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
					const prfSalt = crypto.getRandomValues(new Uint8Array(32))
					const [, keyInfo] = await createPrfKey(credential, prfSalt, rpId, wrappedMainKey, existingPrfKey, promptForPrfRetry);
					const newPrivateData = {
						...privateDataCache,
						prfKeys: [
							...privateDataCache.prfKeys,
							keyInfo,
						],
					};
					return [
						newPrivateData,
						async () => {
							setPrivateDataCache(newPrivateData);
						},
					];
				},

				deletePrf: (credentialId: Uint8Array): [EncryptedContainer, CommitCallback] => {
					const newPrivateData = {
						...privateDataCache,
						prfKeys: privateDataCache.prfKeys.filter((keyInfo) => (
							toBase64Url(keyInfo.credentialId) !== toBase64Url(credentialId)
						)),
					};
					return [
						newPrivateData,
						async () => {
							setPrivateDataCache(newPrivateData);
						},
					];
				},

				unlockPassword,
				unlockPrf,

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

				createIdToken: async (nonce: string, audience: string): Promise<{ id_token: string; }> => {
					const [{ alg, did, wrappedPrivateKey }, sessionKey] = await openPrivateData();
					const privateKey = await unwrapPrivateKey(wrappedPrivateKey, sessionKey);
					const jws = await new SignJWT({ nonce: nonce })
						.setProtectedHeader({
							alg,
							typ: "JWT",
							kid: did + "#" + did.split(":")[2],
						})
						.setSubject(did)
						.setIssuer(did)
						.setExpirationTime('1m')
						.setAudience(audience)
						.setIssuedAt()
						.sign(privateKey);

					return { id_token: jws };
				},

				signJwtPresentation: async (nonce: string, audience: string, verifiableCredentials: any[]): Promise<{ vpjwt: string }> => {
					const [{ alg, did, wrappedPrivateKey }, sessionKey] = await openPrivateData();
					const privateKey = await unwrapPrivateKey(wrappedPrivateKey, sessionKey);

					const jws = await new SignVerifiablePresentationJWT()
						.setProtectedHeader({
							alg,
							typ: "JWT",
							kid: did + "#" + did.split(":")[2],
						})
						.setVerifiableCredential(verifiableCredentials)
						.setContext(["https://www.w3.org/2018/credentials/v1"])
						.setType(["VerifiablePresentation"])
						.setAudience(audience)
						.setCredentialSchema(
							verifiablePresentationSchemaURL,
							"FullJsonSchemaValidator2021")
						.setIssuer(did)
						.setSubject(did)
						.setHolder(did)
						.setJti(`urn:id:${uuidv4()}`)
						.setNonce(nonce)
						.setIssuedAt()
						.setExpirationTime('1m')
						.sign(privateKey);
					return { vpjwt: jws };
				},

				generateOpenid4vciProof: async (nonce: string, audience: string): Promise<{ proof_jwt: string }> => {
					const [{ alg, did, wrappedPrivateKey }, sessionKey] = await openPrivateData();
					const privateKey = await unwrapPrivateKey(wrappedPrivateKey, sessionKey);
					const header = {
						alg,
						typ: "openid4vci-proof+jwt",
						kid: did + "#" + did.split(":")[2]
					};

					const jws = await new SignJWT({ nonce: nonce })
						.setProtectedHeader(header)
						.setIssuedAt()
						.setIssuer(did)
						.setAudience(audience)
						.setExpirationTime('1m')
						.sign(privateKey);
					return { proof_jwt: jws };
				},
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
