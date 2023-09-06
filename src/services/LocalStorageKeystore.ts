import { useCallback, useMemo } from "react";
import * as jose from "jose";
import { JWK, SignJWT } from "jose";
import { v4 as uuidv4 } from "uuid";
import { SignVerifiablePresentationJWT } from "@gunet/ssi-sdk";
import { util } from '@cef-ebsi/key-did-resolver';

import { verifiablePresentationSchemaURL } from "../constants";
import { useLocalStorage, useSessionStorage } from "../components/useStorage";
import { jsonParseTaggedBinary, jsonStringifyTaggedBinary } from "../util";
import { useIndexedDb } from "../components/useIndexedDb";


export type EncryptedContainer = {
	jwe: string;
	pbkdf2Params: Pbkdf2Params;
}

// Values from OWASP password guidelines https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pbkdf2
const pbkdfHash: HashAlgorithmIdentifier = "SHA-256";
const pbkdfIterations: number = 600000;


type WebauthnPrfEncryptionKeyInfo = {
	credentialId: Uint8Array,
	prfSalt: Uint8Array,
	hkdfSalt: Uint8Array,
	hkdfInfo: Uint8Array,
}

async function derivePbkdf2EncryptionKey(params: Pbkdf2Params, passwordKey: CryptoKey): Promise<CryptoKey> {
	return await crypto.subtle.deriveKey(
		params,
		passwordKey,
		{ name: "AES-GCM", length: 256 },
		true,
		["encrypt", "decrypt", "wrapKey", "unwrapKey"],
	);
}

async function wrapEncryptionKey(encryptionKey: CryptoKey, wrappingKey: CryptoKey): Promise<ArrayBuffer> {
	return await crypto.subtle.wrapKey(
		"raw",
		encryptionKey,
		wrappingKey,
		"AES-KW",
	);
}

async function unwrapEncryptionKey(wrappedKey: BufferSource, wrappingKey: CryptoKey): Promise<CryptoKey> {
	return await crypto.subtle.unwrapKey(
		"raw",
		wrappedKey,
		wrappingKey,
		"AES-KW",
		"AES-GCM",
		false,
		["encrypt", "decrypt", "wrapKey", "unwrapKey"],
	);
}

export type PublicData = {
	publicKey: JWK,
	did: string,
	alg: string,
	verificationMethod: string,
}

type WrappedPrivateKey = {
	privateKey: BufferSource,
	aesGcmParams: AesGcmParams,
	unwrappedKeyAlgo: EcKeyImportParams,
}

export function useLocalStorageKeystore() {
	const [publicDataJwe, setPublicDataJwe] = useLocalStorage<string | null>("publicData", null);
	const [wrappedPrivateKey, setWrappedPrivateKey] = useLocalStorage<WrappedPrivateKey | null>("privateKey", null);
	const [wrappedEncryptionKey, setWrappedEncryptionKey] = useSessionStorage<BufferSource | null>("encryptionKey", null);

	const [dbRead, dbWrite] = useIndexedDb("wallet-frontend", 1, useCallback((db, prevVersion, newVersion) => {
		if (prevVersion < 1) {
			const objectStore = db.createObjectStore("keys", { keyPath: "id" });
			objectStore.createIndex("id", "id", { unique: true });
		}
	}, []));

	return useMemo(
		() => {
			console.log("New LocalStorageKeystore instance");

			const getSessionKey = async (): Promise<CryptoKey> => {
				try {
					const result = await dbRead(
						["keys"], (tr) => tr.objectStore("keys").get("sessionKey")
					);
					return result.sessionKey;
				} catch (e) {
					console.log("Failed to retreive session key", e);
					throw new Error("Failed to retreive session key");
				}
			};

			const getEncryptionKey = async (): Promise<CryptoKey> => {
				if (wrappedEncryptionKey) {
					try {
						return await unwrapEncryptionKey(wrappedEncryptionKey, await getSessionKey());
					} catch (e) {
						console.error("Failed to unwrap encryption key", e);
						throw e;
					}
				} else {
					throw new Error("Encryption key not initialized.");
				}
			}

			const getPublicData = async (): Promise<PublicData> => {
				if (publicDataJwe) {
					return jsonParseTaggedBinary(
						new TextDecoder().decode(
							(await jose.compactDecrypt(publicDataJwe, await getEncryptionKey())).plaintext
						));
				} else {
					throw new Error("Public data not present in storage.");
				}
			};

			const setPublicData = async (publicData: PublicData, encryptionKey: CryptoKey): Promise<void> => {
				const publicDataCleartext = new TextEncoder().encode(jsonStringifyTaggedBinary(publicData));
				const publicDataJwe = await new jose.CompactEncrypt(publicDataCleartext)
					.setProtectedHeader({ alg: "A256GCMKW", enc: "A256GCM" })
					.encrypt(encryptionKey);
				setPublicDataJwe(publicDataJwe);
			};

			const getPrivateKey = async (): Promise<CryptoKey> => {
				if (wrappedPrivateKey) {
					return await crypto.subtle.unwrapKey(
						"jwk",
						wrappedPrivateKey.privateKey,
						await getEncryptionKey(),
						wrappedPrivateKey.aesGcmParams,
						wrappedPrivateKey.unwrappedKeyAlgo,
						false,
						["sign"],
					);
				} else {
					throw new Error("Private key not present in storage.");
				}
			};

			const unlockPassword = async (password: string, pbkdf2Params: Pbkdf2Params): Promise<CryptoKey> => {
				const passwordKey = await crypto.subtle.importKey(
					"raw",
					new TextEncoder().encode(password),
					"PBKDF2",
					false,
					["deriveKey"],
				);

				return await derivePbkdf2EncryptionKey(pbkdf2Params, passwordKey);
			};

			const unlock = async (encryptionKey: CryptoKey, privateData: EncryptedContainer): Promise<void> => {
				const sessionKey = await crypto.subtle.generateKey(
					{ name: "AES-KW", length: 256 },
					false,
					["wrapKey", "unwrapKey"],
				);

				await dbWrite(["keys"], (tr) => tr.objectStore("keys").put({ id: "sessionKey", sessionKey }));
				setWrappedEncryptionKey(await wrapEncryptionKey(encryptionKey, sessionKey));

				const {
					publicKey,
					did,
					alg,
					verificationMethod,
					wrappedPrivateKey,
				} = jsonParseTaggedBinary(new TextDecoder().decode(
					(await jose.compactDecrypt(privateData.jwe, encryptionKey)).plaintext
				));
				setPublicData(
					{
						publicKey,
						did,
						alg,
						verificationMethod,
					},
					encryptionKey,
				);
				setWrappedPrivateKey(wrappedPrivateKey);
			};

			const createWallet = async (encryptionKey: CryptoKey): Promise<{ publicData: PublicData, privateDataJwe: string }> => {
				const alg = "ES256";
				const { publicKey, privateKey } = await jose.generateKeyPair(alg, { extractable: true });

				const privateKeyAesGcmParams: AesGcmParams = {
					name: "AES-GCM",
					iv: crypto.getRandomValues(new Uint8Array(96 / 8)),
					additionalData: new Uint8Array([]),
					tagLength: 128,
				};
				const wrappedPrivateKey: WrappedPrivateKey = {
					privateKey: await crypto.subtle.wrapKey("jwk", privateKey as CryptoKey, encryptionKey, privateKeyAesGcmParams),
					aesGcmParams: privateKeyAesGcmParams,
					unwrappedKeyAlgo: { name: "ECDSA", namedCurve: "P-256" },
				};
				setWrappedPrivateKey(wrappedPrivateKey);

				const publicKeyJWK = await jose.exportJWK(publicKey);
				const did = util.createDid(publicKeyJWK);
				const publicData = {
					publicKey: publicKeyJWK,
					did: did,
					alg: alg,
					verificationMethod: did + "#" + did.split(':')[2]
				};
				setPublicData(publicData, encryptionKey);

				const privateData = {
					...publicData,
					wrappedPrivateKey,
				};
				const privateDataCleartext = new TextEncoder().encode(jsonStringifyTaggedBinary(privateData));
				const privateDataJwe = await new jose.CompactEncrypt(privateDataCleartext)
					.setProtectedHeader({ alg: "A256GCMKW", enc: "A256GCM" })
					.encrypt(encryptionKey);

				return {
					publicData,
					privateDataJwe: privateDataJwe,
				};
			};

			return {
				init: async (password: string): Promise<{ publicData: PublicData, privateData: EncryptedContainer }> => {
					console.log("init");

					const pbkdf2Params: Pbkdf2Params = {
						name: "PBKDF2",
						hash: pbkdfHash,
						iterations: pbkdfIterations,
						salt: crypto.getRandomValues(new Uint8Array(32)),
					};

					const encryptionKey = await unlockPassword(password, pbkdf2Params);
					const { publicData, privateDataJwe } = await createWallet(encryptionKey);
					const privateData: EncryptedContainer = {
						jwe: privateDataJwe,
						pbkdf2Params,
					};
					await unlock(encryptionKey, privateData);

					return {
						publicData,
						privateData,
					};
				},

				unlock,
				unlockPassword,

				createIdToken: async (nonce: string, audience: string): Promise<{ id_token: string; }> => {
					const publicData = await getPublicData();
					const privateKey = await getPrivateKey();
					const jws = await new SignJWT({ nonce: nonce })
						.setProtectedHeader({
							alg: publicData.alg,
							typ: "JWT",
							kid: publicData.did + "#" + publicData.did.split(":")[2],
						})
						.setSubject(publicData.did)
						.setIssuer(publicData.did)
						.setExpirationTime('1m')
						.setAudience(audience)
						.setIssuedAt()
						.sign(privateKey);

					return { id_token: jws };
				},

				signJwtPresentation: async (nonce: string, audience: string, verifiableCredentials: any[]): Promise<{ vpjwt: string }> => {
					const publicData = await getPublicData();
					const privateKey = await getPrivateKey();

					const jws = await new SignVerifiablePresentationJWT()
						.setProtectedHeader({
							alg: publicData.alg,
							typ: "JWT",
							kid: publicData.did + "#" + publicData.did.split(":")[2],
						})
						.setVerifiableCredential(verifiableCredentials)
						.setContext(["https://www.w3.org/2018/credentials/v1"])
						.setType(["VerifiablePresentation"])
						.setAudience(audience)
						.setCredentialSchema(
							verifiablePresentationSchemaURL,
							"FullJsonSchemaValidator2021")
						.setIssuer(publicData.did)
						.setSubject(publicData.did)
						.setHolder(publicData.did)
						.setJti(`urn:id:${uuidv4()}`)
						.setNonce(nonce)
						.setIssuedAt()
						.setExpirationTime('1m')
						.sign(privateKey);
					return { vpjwt: jws };
				},

				generateOpenid4vciProof: async (audience: string, nonce: string): Promise<{ proof_jwt: string }> => {
					const publicData = await getPublicData();
					const privateKey = await getPrivateKey();
					const header = {
						alg: publicData.alg,
						typ: "openid4vci-proof+jwt",
						kid: publicData.did + "#" + publicData.did.split(":")[2]
					};

					const jws = await new SignJWT({ nonce: nonce })
						.setProtectedHeader(header)
						.setIssuedAt()
						.setIssuer(publicData.did)
						.setAudience(audience)
						.setExpirationTime('1m')
						.sign(privateKey);
					return { proof_jwt: jws };
				},
			};
		},
		[
			dbRead,
			dbWrite,
			publicDataJwe,
			setPublicDataJwe,
			setWrappedEncryptionKey,
			setWrappedPrivateKey,
			wrappedEncryptionKey,
			wrappedPrivateKey,
		],
	);
}
