import { useCallback, useEffect, useMemo } from "react";
import * as jose from "jose";
import { JWK, SignJWT } from "jose";
import { v4 as uuidv4 } from "uuid";
import { SignVerifiablePresentationJWT } from "@wwwallet/ssi-sdk";
import { util } from '@cef-ebsi/key-did-resolver';

import { verifiablePresentationSchemaURL } from "../constants";
import { useClearStorages, useLocalStorage, useSessionStorage } from "../components/useStorage";
import { jsonParseTaggedBinary, jsonStringifyTaggedBinary, toBase64Url } from "../util";
import { useIndexedDb } from "../components/useIndexedDb";


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

export type EncryptedContainer = {
	jwe: string;
	passwordKey?: PasswordKeyInfo;
	prfKeys: WebauthnPrfEncryptionKeyInfo[];
}

// Values from OWASP password guidelines https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pbkdf2
const pbkdfHash: HashAlgorithmIdentifier = "SHA-256";
const pbkdfIterations: number = 600000;

export type WrappedKeyInfo = {
	wrappedKey: Uint8Array,
	unwrapAlgo: "AES-KW",
	unwrappedKeyAlgo: KeyAlgorithm,
}

type PasswordKeyInfo = {
	mainKey: WrappedKeyInfo,
	pbkdf2Params: Pbkdf2Params;
}

type WebauthnPrfSaltInfo = {
	credentialId: Uint8Array,
	prfSalt: Uint8Array,
}

type WebauthnPrfEncryptionKeyInfo = WebauthnPrfSaltInfo & {
	mainKey: WrappedKeyInfo,
	hkdfSalt: Uint8Array,
	hkdfInfo: Uint8Array,
}

type PrfExtensionInput = { eval: { first: BufferSource } } | { evalByCredential: PrfEvalByCredential };
type PrfEvalByCredential = { [credentialId: string]: { first: BufferSource } };
type PrfExtensionOutput = { enabled: boolean, results?: { first?: ArrayBuffer } };

export type PublicData = {
	publicKey: JWK,
	did: string,
	alg: string,
	verificationMethod: string,
}

export type PrivateData = PublicData & {
	wrappedPrivateKey: WrappedPrivateKey,
}

type WrappedPrivateKey = {
	privateKey: BufferSource,
	aesGcmParams: AesGcmParams,
	unwrappedKeyAlgo: EcKeyImportParams,
}


async function createMainKey(wrappingKey: CryptoKey): Promise<WrappedKeyInfo> {
	const mainKey = await crypto.subtle.generateKey(
		{ name: "AES-GCM", length: 256 },
		true,
		["encrypt"],
	);
	return await wrapKey(wrappingKey, mainKey);
}

async function wrapKey(wrappingKey: CryptoKey, keyToWrap: CryptoKey): Promise<WrappedKeyInfo> {
	const wrapAlgo = "AES-KW";
	const wrappedKey = new Uint8Array(await crypto.subtle.wrapKey(
		"raw",
		keyToWrap,
		wrappingKey,
		wrapAlgo,
	));

	return {
		unwrappedKeyAlgo: keyToWrap.algorithm,
		unwrapAlgo: wrapAlgo,
		wrappedKey,
	};
}

async function unwrapKey(wrappingKey: CryptoKey, keyInfo: WrappedKeyInfo, extractable: boolean = false): Promise<CryptoKey> {
	return await crypto.subtle.unwrapKey(
		"raw",
		keyInfo.wrappedKey,
		wrappingKey,
		keyInfo.unwrapAlgo,
		keyInfo.unwrappedKeyAlgo,
		extractable,
		["encrypt", "decrypt", "wrapKey", "unwrapKey"],
	);
}

async function rewrapKey(wrappedKey: WrappedKeyInfo, unwrappingKey: CryptoKey, wrappingKey: CryptoKey): Promise<WrappedKeyInfo> {
	const unwrappedKey = await unwrapKey(unwrappingKey, wrappedKey, true);
	return await wrapKey(wrappingKey, unwrappedKey);
}

async function unwrapPrivateKey(wrappedPrivateKey: WrappedPrivateKey, wrappingKey: CryptoKey, extractable: boolean = false): Promise<CryptoKey> {
	return await crypto.subtle.unwrapKey(
		"jwk",
		wrappedPrivateKey.privateKey,
		wrappingKey,
		wrappedPrivateKey.aesGcmParams,
		wrappedPrivateKey.unwrappedKeyAlgo,
		extractable,
		["sign"],
	);
};

async function wrapPrivateKey(privateKey: CryptoKey, wrappingKey: CryptoKey): Promise<WrappedPrivateKey> {
	const privateKeyAesGcmParams: AesGcmParams = {
		name: "AES-GCM",
		iv: crypto.getRandomValues(new Uint8Array(96 / 8)),
		additionalData: new Uint8Array([]),
		tagLength: 128,
	};
	return {
		privateKey: await crypto.subtle.wrapKey("jwk", privateKey, wrappingKey, privateKeyAesGcmParams),
		aesGcmParams: privateKeyAesGcmParams,
		unwrappedKeyAlgo: { name: "ECDSA", namedCurve: "P-256" },
	};
};

async function encryptPrivateData(privateData: PrivateData, encryptionKey: CryptoKey): Promise<string> {
	const cleartext = new TextEncoder().encode(jsonStringifyTaggedBinary(privateData));
	return await new jose.CompactEncrypt(cleartext)
		.setProtectedHeader({ alg: "A256GCMKW", enc: "A256GCM" })
		.encrypt(encryptionKey);
};

async function decryptPrivateData(privateDataJwe: string, encryptionKey: CryptoKey): Promise<PrivateData> {
	return jsonParseTaggedBinary(
		new TextDecoder().decode(
			(await jose.compactDecrypt(privateDataJwe, encryptionKey)).plaintext
		));
};

async function reencryptPrivateData(privateDataJwe: string, fromKey: CryptoKey, toKey: CryptoKey): Promise<string> {
	const privateData = await decryptPrivateData(privateDataJwe, fromKey);
	const privateKey = await unwrapPrivateKey(privateData.wrappedPrivateKey, fromKey, true);
	privateData.wrappedPrivateKey = await wrapPrivateKey(privateKey, toKey);
	return await encryptPrivateData(privateData, toKey);
}

async function derivePasswordKey(password: string, pbkdf2Params: Pbkdf2Params): Promise<CryptoKey> {
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveKey"],
	);

	return await crypto.subtle.deriveKey(
		pbkdf2Params,
		keyMaterial,
		{ name: "AES-KW", length: 256 },
		true,
		["wrapKey", "unwrapKey"],
	);
};

async function derivePrfKey(prfOutput: BufferSource, hkdfSalt: BufferSource, hkdfInfo: BufferSource): Promise<CryptoKey> {
	const hkdfKey = await crypto.subtle.importKey(
		"raw",
		prfOutput,
		"HKDF",
		false,
		["deriveKey"],
	);

	return await crypto.subtle.deriveKey(
		{ name: "HKDF", hash: "SHA-256", salt: hkdfSalt, info: hkdfInfo },
		hkdfKey,
		{ name: "AES-KW", length: 256 },
		true,
		["wrapKey", "unwrapKey"],
	);
}

export function makePrfExtensionInputs(prfKeys: WebauthnPrfSaltInfo[]): {
	allowCredentials: PublicKeyCredentialDescriptor[],
	prfInput: PrfExtensionInput,
} {
	return {
		allowCredentials: prfKeys.map(
			(keyInfo: WebauthnPrfSaltInfo) => ({
				type: "public-key",
				id: keyInfo.credentialId,
			})
		),
		prfInput: {
			evalByCredential: prfKeys.reduce(
				(result: { [credentialId: string]: { first: BufferSource } }, keyInfo: WebauthnPrfSaltInfo) => {
					result[toBase64Url(keyInfo.credentialId)] = { first: keyInfo.prfSalt };
					return result;
				},
				{},
			),
		}
	};
}

async function getPrfOutput(
	credential: PublicKeyCredential | null,
	rpId: string,
	prfInputs: { allowCredentials?: PublicKeyCredentialDescriptor[], prfInput: PrfExtensionInput },
	promptForRetry: () => Promise<boolean>,
): Promise<[ArrayBuffer, PublicKeyCredential]> {
	console.log("getPrfOutput", credential, rpId, prfInputs);

	const clientExtensionOutputs = credential?.getClientExtensionResults() as { prf?: PrfExtensionOutput };
	const canRetry = !clientExtensionOutputs?.prf || clientExtensionOutputs?.prf?.enabled;

	if (clientExtensionOutputs?.prf?.results?.first) {
		return [clientExtensionOutputs?.prf?.results?.first, credential];

	} else if (canRetry) {
		if (await promptForRetry()) {
			try {
				const retryCred = await navigator.credentials.get({
					publicKey: {
						rpId,
						challenge: crypto.getRandomValues(new Uint8Array(32)),
						allowCredentials: prfInputs?.allowCredentials,
						extensions: { prf: prfInputs.prfInput } as AuthenticationExtensionsClientInputs,
					},
				}) as PublicKeyCredential;
				return await getPrfOutput(retryCred, rpId, prfInputs, async () => false);
			} catch (err) {
				if (err instanceof DOMException && err.name === "NotAllowedError") {
					throw { errorId: "prf_retry_failed", credential };
				} else {
					throw { errorId: "failed" };
				}
			}

		} else {
			throw { errorId: "canceled" };
		}

	} else {
		throw { errorId: "prf_not_supported" };
	}
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
	generateOpenid4vciProof(audience: string, nonce: string): Promise<{ proof_jwt: string }>,
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
			const createSessionKey = async (): Promise<CryptoKey> => {
				const sessionKey = await crypto.subtle.generateKey(
					{ name: "AES-GCM", length: 256 },
					true,
					["encrypt", "wrapKey"],
				);
				const exportedSessionKey = await crypto.subtle.exportKey(
					"raw",
					sessionKey,
				);
				setSessionKey(exportedSessionKey);
				return sessionKey;
			}

			const getSessionKey = async (): Promise<CryptoKey> => {
				if (sessionKey) {
					return await crypto.subtle.importKey(
						"raw",
						sessionKey,
						"AES-GCM",
						false,
						["decrypt", "unwrapKey"],
					);
				} else {
					throw new Error("Session key not initialized");
				}
			};

			const openPrivateData = async (): Promise<[PrivateData, CryptoKey]> => {
				if (privateDataJwe) {
					const sessionKey = await getSessionKey();
					const privateData = jsonParseTaggedBinary(
						new TextDecoder().decode(
							(await jose.compactDecrypt(privateDataJwe, sessionKey)).plaintext
						));
					return [privateData, sessionKey];
				} else {
					throw new Error("Private data not present in storage.");
				}
			};

			const unlock = async (mainKey: CryptoKey, privateData: EncryptedContainer, user: CachedUser | UserData): Promise<void> => {
				const sessionKey = await createSessionKey();
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

			const createPrfKey = async (
				credential: PublicKeyCredential | null,
				prfSalt: Uint8Array,
				rpId: string,
				wrappedMainKey: WrappedKeyInfo | null,
				unwrappingKey: CryptoKey | null,
				promptForPrfRetry: () => Promise<boolean>,
			): Promise<[CryptoKey, WebauthnPrfEncryptionKeyInfo]> => {
				const [prfOutput,] = await getPrfOutput(
					credential,
					rpId,
					{
						allowCredentials: [{ type: "public-key", id: credential.rawId }],
						prfInput: { eval: { first: prfSalt } },
					},
					promptForPrfRetry,
				);
				const hkdfSalt = crypto.getRandomValues(new Uint8Array(32));
				const hkdfInfo = new TextEncoder().encode("eDiplomas PRF");
				const prfKey = await derivePrfKey(prfOutput, hkdfSalt, hkdfInfo);
				const mainKey = wrappedMainKey
					? await rewrapKey(wrappedMainKey, unwrappingKey, prfKey)
					: await createMainKey(prfKey);
				const keyInfo: WebauthnPrfEncryptionKeyInfo = {
					mainKey,
					credentialId: new Uint8Array(credential.rawId),
					prfSalt,
					hkdfSalt,
					hkdfInfo,
				};
				return [prfKey, keyInfo];
			}

			const getPrfKey = async (
				privateData: EncryptedContainer,
				credential: PublicKeyCredential | null,
				rpId: string,
				promptForPrfRetry: () => Promise<boolean>,
			): Promise<[CryptoKey, WebauthnPrfEncryptionKeyInfo]> => {
				console.log("getPrfKey", privateData, credential, rpId);
				const [prfOutput, prfCredential] = await getPrfOutput(
					credential,
					rpId,
					makePrfExtensionInputs(privateData.prfKeys),
					promptForPrfRetry,
				);
				const keyInfo = privateData.prfKeys.find(keyInfo => toBase64Url(keyInfo.credentialId) === prfCredential.id);
				return [await derivePrfKey(prfOutput, keyInfo.hkdfSalt, keyInfo.hkdfInfo), keyInfo];
			}

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

			const createWallet = async (mainKey: CryptoKey): Promise<{ publicData: PublicData, privateDataJwe: string }> => {
				const alg = "ES256";
				const { publicKey, privateKey } = await jose.generateKeyPair(alg, { extractable: true });

				const wrappedPrivateKey: WrappedPrivateKey = await wrapPrivateKey(privateKey as CryptoKey, mainKey);

				const publicKeyJWK = await jose.exportJWK(publicKey);
				const did = util.createDid(publicKeyJWK);
				const publicData = {
					publicKey: publicKeyJWK,
					did: did,
					alg: alg,
					verificationMethod: did + "#" + did.split(':')[2]
				};
				const privateData: PrivateData = {
					...publicData,
					wrappedPrivateKey,
				}
				const privateDataJwe = await encryptPrivateData(privateData, mainKey);

				return {
					publicData,
					privateDataJwe,
				};
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

				generateOpenid4vciProof: async (audience: string, nonce: string): Promise<{ proof_jwt: string }> => {
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
