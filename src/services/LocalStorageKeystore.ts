import { useCallback, useMemo } from "react";
import * as jose from "jose";
import { JWK, SignJWT } from "jose";
import { v4 as uuidv4 } from "uuid";
import { SignVerifiablePresentationJWT } from "@gunet/ssi-sdk";
import { util } from '@cef-ebsi/key-did-resolver';

import { verifiablePresentationSchemaURL } from "../constants";
import { useClearLocalStorage, useClearSessionStorage, useLocalStorage, useSessionStorage } from "../components/useStorage";
import { jsonParseTaggedBinary, jsonStringifyTaggedBinary } from "../util";
import { useIndexedDb } from "../components/useIndexedDb";


export type EncryptedContainer = {
	jwe: string;
	passwordKey?: PasswordKeyInfo;
}

// Values from OWASP password guidelines https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pbkdf2
const pbkdfHash: HashAlgorithmIdentifier = "SHA-256";
const pbkdfIterations: number = 600000;

type WrappedKeyInfo = {
	wrappedKey: Uint8Array,
	unwrapAlgo: "AES-KW",
	unwrappedKeyAlgo: "AES-GCM",
}

type PasswordKeyInfo = {
	mainKey: WrappedKeyInfo,
	pbkdf2Params: Pbkdf2Params;
}

type WebauthnPrfEncryptionKeyInfo = {
	credentialId: Uint8Array,
	prfSalt: Uint8Array,
	hkdfSalt: Uint8Array,
	hkdfInfo: Uint8Array,
}

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
	const partialKeyInfo: { unwrapAlgo: "AES-KW", unwrappedKeyAlgo: "AES-GCM" } = {
		unwrapAlgo: "AES-KW",
		unwrappedKeyAlgo: "AES-GCM",
	};

	const mainKeyAlgorithm = { name: partialKeyInfo.unwrappedKeyAlgo, length: 256 };
	const mainKey = await crypto.subtle.generateKey(
		mainKeyAlgorithm,
		true,
		["encrypt"],
	);

	const wrappedKey = new Uint8Array(await crypto.subtle.wrapKey(
		"raw",
		mainKey,
		wrappingKey,
		partialKeyInfo.unwrapAlgo,
	));
	const keyInfo: WrappedKeyInfo = {
		...partialKeyInfo,
		wrappedKey,
	};

	return keyInfo;
}

async function unwrapMainKey(wrappingKey: CryptoKey, keyInfo: WrappedKeyInfo): Promise<CryptoKey> {
	return await crypto.subtle.unwrapKey(
		"raw",
		keyInfo.wrappedKey,
		wrappingKey,
		keyInfo.unwrapAlgo,
		keyInfo.unwrappedKeyAlgo,
		false,
		["encrypt", "decrypt", "wrapKey", "unwrapKey"],
	);
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


export function useLocalStorageKeystore() {
	const [privateDataJwe, setPrivateDataJwe] = useLocalStorage<string | null>("privateData", null);
	const [innerSessionKey, setInnerSessionKey] = useSessionStorage<BufferSource | null>("sessionKey", null);
	const clearLocalStorage = useClearLocalStorage();
	const clearSessionStorage = useClearSessionStorage();

	const idb = useIndexedDb("wallet-frontend", 1, useCallback((db, prevVersion, newVersion) => {
		if (prevVersion < 1) {
			const objectStore = db.createObjectStore("keys", { keyPath: "id" });
			objectStore.createIndex("id", "id", { unique: true });
		}
	}, []));

	return useMemo(
		() => {
			console.log("New LocalStorageKeystore instance");

			const createOuterSessionKey = async (): Promise<CryptoKey> => {
				const outerSessionKey = await crypto.subtle.generateKey(
					{ name: "AES-KW", length: 256 },
					false,
					["wrapKey", "unwrapKey"],
				);
				await idb.write(["keys"], (tr) => tr.objectStore("keys").put({
					id: "sessionKey",
					value: outerSessionKey,
				}));
				return outerSessionKey;
			}

			const getOuterSessionKey = async (): Promise<CryptoKey> => {
				try {
					const result = await idb.read(
						["keys"], (tr) => tr.objectStore("keys").get("sessionKey")
					);
					return result.value;
				} catch (e) {
					console.log("Failed to retreive session key", e);
					throw new Error("Failed to retreive session key");
				}
			};

			const createInnerSessionKey = async (outerSessionKey: CryptoKey): Promise<CryptoKey> => {
				const innerSessionKey = await crypto.subtle.generateKey(
					{ name: "AES-GCM", length: 256 },
					true,
					["encrypt", "wrapKey"],
				);
				const wrappedInnerSessionKey = await crypto.subtle.wrapKey(
					"raw",
					innerSessionKey,
					outerSessionKey,
					"AES-KW",
				);
				setInnerSessionKey(wrappedInnerSessionKey);
				return innerSessionKey;
			}

			const getInnerSessionKey = async (outerSessionKey: CryptoKey): Promise<CryptoKey> => {
				if (innerSessionKey) {
					return await crypto.subtle.unwrapKey(
						"raw",
						innerSessionKey,
						outerSessionKey,
						"AES-KW",
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
					const innerSessionKey = await getInnerSessionKey(await getOuterSessionKey());
					const privateData = jsonParseTaggedBinary(
						new TextDecoder().decode(
							(await jose.compactDecrypt(privateDataJwe, innerSessionKey)).plaintext
						));
					return [privateData, innerSessionKey];
				} else {
					throw new Error("Private data not present in storage.");
				}
			};

			const unlock = async (mainKey: CryptoKey, privateData: EncryptedContainer): Promise<void> => {
				const outerSessionKey = await createOuterSessionKey();
				const innerSessionKey = await createInnerSessionKey(outerSessionKey);
				const reencryptedPrivateData = await reencryptPrivateData(privateData.jwe, mainKey, innerSessionKey);
				setPrivateDataJwe(reencryptedPrivateData);
			};

			const unlockPassword = async (privateData: EncryptedContainer, password: string, keyInfo: PasswordKeyInfo): Promise<void> => {
				const passwordKey = await derivePasswordKey(password, keyInfo.pbkdf2Params);
				const mainKey = await unwrapMainKey(passwordKey, keyInfo.mainKey);
				return await unlock(mainKey, privateData);
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

			return {
				close: async (): Promise<void> => {
					idb.destroy(); // This can take a long time, so don't await it
					clearLocalStorage();
					clearSessionStorage();
				},

				init: async (password: string): Promise<{ publicData: PublicData, privateData: EncryptedContainer }> => {
					console.log("init");

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
					};
					const mainKey = await unwrapMainKey(passwordKey, wrappedMainKey);

					const { publicData, privateDataJwe } = await createWallet(mainKey);
					const privateData: EncryptedContainer = {
						jwe: privateDataJwe,
						passwordKey: passwordKeyInfo,
					};
					await unlock(mainKey, privateData);

					return {
						publicData,
						privateData,
					};
				},

				unlockPassword,

				createIdToken: async (nonce: string, audience: string): Promise<{ id_token: string; }> => {
					const [{ alg, did, wrappedPrivateKey }, innerSessionKey] = await openPrivateData();
					const privateKey = await unwrapPrivateKey(wrappedPrivateKey, innerSessionKey);
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
					const [{ alg, did, wrappedPrivateKey }, innerSessionKey] = await openPrivateData();
					const privateKey = await unwrapPrivateKey(wrappedPrivateKey, innerSessionKey);

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
					const [{ alg, did, wrappedPrivateKey }, innerSessionKey] = await openPrivateData();
					const privateKey = await unwrapPrivateKey(wrappedPrivateKey, innerSessionKey);
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
			clearLocalStorage,
			clearSessionStorage,
			idb,
			innerSessionKey,
			privateDataJwe,
			setInnerSessionKey,
			setPrivateDataJwe,
		],
	);
}
