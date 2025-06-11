import * as jose from "jose";
import { JWK, SignJWT } from "jose";
import { base58btc } from 'multiformats/bases/base58';
import { varint } from 'multiformats';
import * as KeyDidResolver from 'key-did-resolver'
import { Resolver } from 'did-resolver'
import * as didUtil from "@cef-ebsi/key-did-resolver/dist/util.js";
import * as cbor from 'cbor-web';

import * as config from '../config';
import type { DidKeyVersion } from '../config';
import { byteArrayEquals, filterObject, jsonParseTaggedBinary, jsonStringifyTaggedBinary, sequentialAll, toBase64Url } from "../util";
import { SDJwt } from "@sd-jwt/core";
import { cborEncode, cborDecode, DataItem, getCborEncodeDecodeOptions, setCborEncodeDecodeOptions } from "@auth0/mdl/lib/cbor";
import { DeviceResponse, MDoc } from "@auth0/mdl";
import { SupportedAlgs } from "@auth0/mdl/lib/mdoc/model/types";
import { COSEKeyToJWK } from "cose-kit";
import { withHintsFromAllowCredentials } from "@/util-webauthn";
import { toArrayBuffer } from "../types/webauthn";
import type { AuthenticationExtensionsPRFInputs, PublicKeyCredentialCreation } from "../types/webauthn";
import { parseAuthenticatorData, parseCoseKeyArkgPubSeed, ParsedCOSEKeyArkgPubSeed } from "../webauthn";
import * as arkg from "wallet-common/dist/arkg";
import * as ec from "wallet-common/dist/arkg/ec";
import * as webauthn from "../webauthn";
import { COSE_ALG_ESP256_ARKG, COSE_KTY_ARKG_DERIVED } from "../coseConstants";
import { UiStateMachineFunction } from "../context/WebauthnInteractionDialogContext";


const keyDidResolver = KeyDidResolver.getResolver();
const didResolver = new Resolver(keyDidResolver);


type EncryptedContainerContent = { jwe: string }
export type EncryptedContainerKeys = {
	mainKey?: EphemeralEncapsulationInfo,
	passwordKey?: PasswordKeyInfo,
	prfKeys: WebauthnPrfEncryptionKeyInfo[],
}
export type MixedEncryptedContainer = EncryptedContainerKeys & EncryptedContainerContent;

export type AsymmetricEncryptedContainerKeys = {
	mainKey: EphemeralEncapsulationInfo,
	passwordKey?: AsymmetricPasswordKeyInfo,
	prfKeys: WebauthnPrfEncryptionKeyInfoV2[],
}
export type AsymmetricEncryptedContainer = AsymmetricEncryptedContainerKeys & EncryptedContainerContent;
export type OpenedContainer = [AsymmetricEncryptedContainer, CryptoKey];

export type EncryptedContainer = MixedEncryptedContainer | AsymmetricEncryptedContainer;

type EphemeralEncapsulationInfo = {
	publicKey: EncapsulationPublicKeyInfo,
	unwrapKey: {
		format: "raw",
		unwrapAlgo: "AES-KW",
		unwrappedKeyAlgo: KeyAlgorithm,
	},
}

type StaticEncapsulationInfo = {
	keypair: EncapsulationKeypairInfo,
	unwrapKey: {
		wrappedKey: Uint8Array,
		unwrappingKey: EncapsulationUnwrappingKeyInfo,
	},
}


function isAsymmetricEncryptedContainer(privateData: EncryptedContainer): privateData is AsymmetricEncryptedContainer {
	return (
		(privateData.passwordKey
			? isAsymmetricPasswordKeyInfo(privateData.passwordKey)
			: true)
		&& (privateData.prfKeys
			? privateData.prfKeys.every(isPrfKeyV2)
			: true)
	);
}

export function assertAsymmetricEncryptedContainer(privateData: EncryptedContainer): AsymmetricEncryptedContainer {
	if (isAsymmetricEncryptedContainer(privateData)) {
		return privateData;
	} else {
		throw new Error("Keystore must be upgraded to asymmetric format");
	}
}

// Values from OWASP password guidelines https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pbkdf2
const pbkdfHash: HashAlgorithmIdentifier = "SHA-256";
const pbkdfIterations: number = 600000;

type SymmetricWrappedKeyInfo = {
	wrappedKey: Uint8Array,
	unwrapAlgo: "AES-KW",
	unwrappedKeyAlgo: KeyAlgorithm,
};

export type WrappedKeyInfo = SymmetricWrappedKeyInfo | StaticEncapsulationInfo;

export function isAsymmetricWrappedKeyInfo(keyInfo: WrappedKeyInfo): keyInfo is StaticEncapsulationInfo {
	return "keypair" in keyInfo && "unwrapKey" in keyInfo;
}

type EncapsulationPublicKeyInfo = {
	importKey: {
		format: "raw",
		keyData: Uint8Array,
		algorithm: EcKeyImportParams,
	},
}

type EncapsulationPrivateKeyInfo = {
	unwrapKey: {
		format: KeyFormat,
		wrappedKey: Uint8Array,
		unwrapAlgo: AesGcmParams,
		unwrappedKeyAlgo: EcKeyImportParams,
	},
}

type EncapsulationKeypairInfo = {
	publicKey: EncapsulationPublicKeyInfo,
	privateKey: EncapsulationPrivateKeyInfo,
}

type EncapsulationUnwrappingKeyInfo = {
	deriveKey: {
		algorithm: {
			name: "ECDH",
		},
		derivedKeyAlgorithm: { name: "AES-KW", length: 256 },
	},
};

type DerivePasswordKeyInfo = {
	pbkdf2Params: Pbkdf2Params;
	algorithm?: { name: "AES-GCM", length: 256 },
}

export type AsymmetricPasswordKeyInfo = DerivePasswordKeyInfo & StaticEncapsulationInfo;
type SymmetricPasswordKeyInfo = DerivePasswordKeyInfo & {
	mainKey: SymmetricWrappedKeyInfo,
}
type PasswordKeyInfo = (SymmetricPasswordKeyInfo | AsymmetricPasswordKeyInfo);
export function isAsymmetricPasswordKeyInfo(passwordKeyInfo: PasswordKeyInfo): passwordKeyInfo is AsymmetricPasswordKeyInfo {
	return (
		"mainKey" in passwordKeyInfo
			? false
			: isAsymmetricWrappedKeyInfo(passwordKeyInfo)
	);
}

export type PrecreatedPublicKeyCredential = {
	credential: PublicKeyCredentialCreation,
	prfSalt: Uint8Array,
}

export type WebauthnPrfSaltInfo = {
	credentialId: Uint8Array,
	transports?: AuthenticatorTransport[],
	prfSalt: Uint8Array,
}

export type WebauthnPrfEncryptionKeyInfo = (
	WebauthnPrfEncryptionKeyInfoV1
	| WebauthnPrfEncryptionKeyInfoV2
);
type WebauthnPrfEncryptionKeyDeriveKeyParams = {
	hkdfSalt: Uint8Array,
	hkdfInfo: Uint8Array,
	algorithm?: AesKeyGenParams,
}
type WebauthnPrfEncryptionKeyInfoV1 = WebauthnPrfSaltInfo & WebauthnPrfEncryptionKeyDeriveKeyParams & {
	mainKey: SymmetricWrappedKeyInfo,
}
export type WebauthnPrfEncryptionKeyInfoV2 = (
	WebauthnPrfSaltInfo
	& WebauthnPrfEncryptionKeyDeriveKeyParams
	& StaticEncapsulationInfo
);
export function isPrfKeyV2(prfKeyInfo: WebauthnPrfEncryptionKeyInfo): prfKeyInfo is WebauthnPrfEncryptionKeyInfoV2 {
	return (
		"mainKey" in prfKeyInfo
			? false
			: isAsymmetricWrappedKeyInfo(prfKeyInfo)
	);
}

type PrfInputs = {
	allowCredentials?: PublicKeyCredentialDescriptor[],
	prfInput: AuthenticationExtensionsPRFInputs,
};

export type KeystoreV0PublicData = {
	publicKey: JWK,
	did: string,
	alg: string,
	verificationMethod: string,
}
export type KeystoreV0PrivateData = KeystoreV0PublicData & {
	wrappedPrivateKey: WrappedPrivateKey,
}

export function isKeystoreV0PrivateData(privateData: KeystoreV0PrivateData | PrivateData): privateData is KeystoreV0PrivateData {
	return (
		"publicKey" in privateData
		&& "did" in privateData
		&& "alg" in privateData
		&& "verificationMethod" in privateData
		&& "wrappedPrivateKey" in privateData
	);
}

export function migrateV0PrivateData(privateData: KeystoreV0PrivateData | PrivateData): PrivateData {
	if (isKeystoreV0PrivateData(privateData)) {
		return {
			keypairs: {
				[privateData.did]: {
					kid: privateData.did,
					did: privateData.did,
					alg: privateData.alg,
					publicKey: privateData.publicKey,
					wrappedPrivateKey: privateData.wrappedPrivateKey,
				},
			}
		}
	} else {
		return privateData;
	}
}

type WebauthnSignArkgPublicSeed = {
	credentialId: Uint8Array,
	publicSeed: ParsedCOSEKeyArkgPubSeed,
}

type WebauthnSignKeyRef = {
	credentialId: Uint8Array,
	keyRef: Uint8Array,
}

type CredentialKeyPairCommon = {
	kid: string,
	did: string,
	alg: string,
	publicKey: JWK,
}
export type CredentialKeyPairWithWrappedPrivateKey = CredentialKeyPairCommon & {
	wrappedPrivateKey: WrappedPrivateKey,
}
type CredentialKeyPairWithExternalPrivateKey = CredentialKeyPairCommon & {
	externalPrivateKey: WebauthnSignKeyRef,
}
export type CredentialKeyPair = CredentialKeyPairWithWrappedPrivateKey | CredentialKeyPairWithExternalPrivateKey;

type WrappedPrivateKey = {
	privateKey: BufferSource,
	aesGcmParams: AesGcmParams,
	unwrappedKeyAlgo: EcKeyImportParams,
}

export type PrivateData = {
	keypairs: {
		[kid: string]: CredentialKeyPair,
	},
	arkgSeeds?: WebauthnSignArkgPublicSeed[],
}


function makeWebauthnSignFunction(
	rpId: string,
	{ publicKey, externalPrivateKey }: CredentialKeyPairWithExternalPrivateKey,
	uiStateMachine: UiStateMachineFunction,
): (alg: any, key: any, data: Uint8Array) => Promise<Uint8Array> {
	return async (alg, _key, data) => {
		let uiStatePromise = uiStateMachine({ id: 'intro', chosenCredentialId: externalPrivateKey.credentialId });
		let signature = null;

		while (true) {
			const eventResponse = await uiStatePromise;
			switch (eventResponse?.id) {
				case 'intro:ok':
				case 'retry':
					try {
						const webauthnArgs = {
							publicKey: {
								rpId: rpId,
								challenge: crypto.getRandomValues(new Uint8Array(32)),
								allowCredentials: [{ type: "public-key" as "public-key", id: externalPrivateKey.credentialId }],
								extensions: {
									sign: {
										sign: {
											keyHandleByCredential: {
												[toBase64Url(externalPrivateKey.credentialId)]: externalPrivateKey.keyRef,
											},
											tbs: await crypto.subtle.digest("SHA-256", data),
										},
									},
								} as AuthenticationExtensionsClientInputs,
							},
						};
						uiStatePromise = uiStateMachine({ id: 'webauthn-begin', webauthnArgs });
					} catch (e) {
						console.error("Failed to create WebAuthn arguments:", e);
						uiStatePromise = uiStateMachine({ id: 'err', err: e });
					}
					break;

				case 'webauthn-begin:ok':
					const pkc = eventResponse.credential;
					try {
						const authData = parseAuthenticatorData(new Uint8Array((pkc.response as AuthenticatorAssertionResponse).authenticatorData));
						const sig = authData?.extensions?.sign?.get(6);
						if (sig) {
							switch (alg) {
								case "ES256":
									switch (publicKey.crv) {
										case "P-256":
											console.log("Reformatting signature for signature algorithm:", alg, "and public key:", publicKey);
											signature = derSignatureToRaw(sig);
											break;
									}
									break;
							}
							if (signature === null) {
								console.log("Will not reformat signature for signature algorithm:", alg, "and public key:", publicKey);
								signature = sig;
							}
							uiStatePromise = uiStateMachine({ id: 'success' });
						} else {
							uiStatePromise = uiStateMachine({ id: 'err:ext:sign:signature-not-found', credential: pkc, authData });
						}
					} catch (e) {
						console.error("Failed to extract signature from WebAuthn response:", e);
						uiStatePromise = uiStateMachine({ id: 'err', err: e, credential: pkc });
					}
					break;

				case 'cancel':
					throw new Error("Canceled by user", { cause: eventResponse.cause ?? 'canceled_by_user' });

				case 'success:ok':
					return signature;

				default:
					console.log("Unknown state:", eventResponse);
					throw new Error("Unknown state", { cause: eventResponse });
			}
		}
	};
}

function derSignatureToRaw(sig: Uint8Array): Uint8Array {
	const x509Sig = sig;
	const rLen = x509Sig[3];
	const sLen = x509Sig[4 + rLen + 1];

	const r = x509Sig.slice(4, 4 + rLen);
	const s = x509Sig.slice(4 + rLen + 2, 4 + rLen + 2 + sLen);

	return new Uint8Array([
		...new Uint8Array(r.length < 32 ? 32 - r.length : 0),
		...(r.length > 32 ? r.slice(r.length - 32) : r),
		...new Uint8Array(s.length < 32 ? 32 - s.length : 0),
		...(s.length > 32 ? s.slice(s.length - 32) : s),
	]);
}

export async function parsePrivateData(privateData: BufferSource): Promise<EncryptedContainer> {
	return jsonParseTaggedBinary(new TextDecoder().decode(privateData));
}

export function serializePrivateData(privateData: EncryptedContainer): Uint8Array {
	return new TextEncoder().encode(jsonStringifyTaggedBinary(privateData));
}

async function createAsymmetricMainKey(currentMainKey?: CryptoKey): Promise<{ keyInfo: EphemeralEncapsulationInfo, mainKey: CryptoKey, privateKey: CryptoKey }> {
	const mainKey = currentMainKey || await crypto.subtle.generateKey(
		{ name: "AES-GCM", length: 256 },
		true,
		["decrypt", "encrypt", "wrapKey", "unwrapKey"],
	);

	const [mainPublicKeyInfo, mainPrivateKey] = await generateEncapsulationKeypair();
	return {
		keyInfo: {
			publicKey: mainPublicKeyInfo,
			unwrapKey: {
				format: "raw",
				unwrapAlgo: "AES-KW",
				unwrappedKeyAlgo: mainKey.algorithm,
			},
		},
		mainKey,
		privateKey: mainPrivateKey,
	};
}

export type AsyncMapFunc<T> = (value: T) => Promise<T>;
export type WrappedMapFunc<CT, CL> = (wrappedValue: CT, update: AsyncMapFunc<CL>) => Promise<CT>;
export async function updatePrivateData(
	[privateData, currentMainKey]: OpenedContainer,
	update: (
		privateData: PrivateData,
		updateWrappedPrivateKey: WrappedMapFunc<WrappedPrivateKey, CryptoKey>,
	) => Promise<PrivateData>,
): Promise<OpenedContainer> {
	if (!isAsymmetricEncryptedContainer(privateData)) {
		throw new Error("EncryptedContainer is not fully asymmetric-encrypted");
	}

	const {
		keyInfo: newMainPublicKeyInfo,
		mainKey: newMainKey,
		privateKey: newMainPrivateKey,
	} = await createAsymmetricMainKey();

	const privateDataContent = await decryptPrivateData(privateData.jwe, currentMainKey);
	const updateWrappedPrivateKey = async (wrappedPrivateKey: WrappedPrivateKey, update: AsyncMapFunc<CryptoKey>) => {
		const privateKey = await unwrapPrivateKey(wrappedPrivateKey, currentMainKey, true);
		const newPrivateKey = await update(privateKey);
		return await wrapPrivateKey(newPrivateKey, currentMainKey);
	};

	const newPrivateDataContent = await rewrapPrivateKeys(
		await update(privateDataContent, updateWrappedPrivateKey),
		currentMainKey,
		newMainKey,
	);

	return [
		{
			mainKey: newMainPublicKeyInfo,
			jwe: await encryptPrivateData(newPrivateDataContent, newMainKey),
			passwordKey: privateData.passwordKey && {
				...privateData.passwordKey,
				...await encapsulateKey(
					newMainPrivateKey,
					privateData.passwordKey.keypair.publicKey,
					privateData.passwordKey.keypair,
					newMainKey,
				),
			},
			prfKeys: privateData.prfKeys && await Promise.all(
				privateData.prfKeys.map(async keyInfo => ({
					...keyInfo,
					...await encapsulateKey(
						newMainPrivateKey,
						keyInfo.keypair.publicKey,
						keyInfo.keypair,
						newMainKey,
					),
				}))
			),
		},
		newMainKey,
	];
}

export async function exportMainKey(mainKey: CryptoKey): Promise<ArrayBuffer> {
	return await crypto.subtle.exportKey(
		"raw",
		mainKey,
	);
}

export async function importMainKey(exportedMainKey: BufferSource): Promise<CryptoKey> {
	return await crypto.subtle.importKey(
		"raw",
		exportedMainKey,
		"AES-GCM",
		false,
		["decrypt", "wrapKey", "unwrapKey"],
	);
}

export async function openPrivateData(mainKeyOrExportedMainKey: CryptoKey | BufferSource, privateData: EncryptedContainer): Promise<[PrivateData, CryptoKey]> {
	const mainKey = (
		(mainKeyOrExportedMainKey instanceof CryptoKey)
			? mainKeyOrExportedMainKey
			: await importMainKey(mainKeyOrExportedMainKey)
	);
	return [await decryptPrivateData(privateData.jwe, mainKey), mainKey];
}

async function generateEncapsulationKeypair(): Promise<[EncapsulationPublicKeyInfo, CryptoKey]> {
	const algorithm = { name: "ECDH", namedCurve: "P-256" };
	const { publicKey, privateKey } = await crypto.subtle.generateKey(algorithm, true, ["deriveKey"]);
	const publicFormat = "raw";
	return [
		{
			importKey: {
				format: publicFormat,
				keyData: new Uint8Array(await crypto.subtle.exportKey(publicFormat, publicKey)),
				algorithm: algorithm,
			},
		},
		privateKey,
	];
}

async function generateWrappedEncapsulationKeypair(baseWrappingKey: CryptoKey): Promise<[EncapsulationKeypairInfo, CryptoKey]> {
	const [publicKey, privateKey] = await generateEncapsulationKeypair();
	const privateFormat = "jwk";
	const wrapAlgo = { name: "AES-GCM", iv: crypto.getRandomValues(new Uint8Array(96 / 8)) };
	const wrappedKey = new Uint8Array(await crypto.subtle.wrapKey(privateFormat, privateKey, baseWrappingKey, wrapAlgo));

	return [
		{
			publicKey,
			privateKey: {
				unwrapKey: {
					format: privateFormat,
					wrappedKey,
					unwrapAlgo: wrapAlgo,
					unwrappedKeyAlgo: publicKey.importKey.algorithm,
				},
			},
		},
		privateKey,
	];
}

async function unwrapEncapsulationPrivateKey(
	baseWrappingKey: CryptoKey,
	encapsulationPrivateKey: EncapsulationPrivateKeyInfo,
): Promise<CryptoKey> {
	return await crypto.subtle.unwrapKey(
		encapsulationPrivateKey.unwrapKey.format,
		encapsulationPrivateKey.unwrapKey.wrappedKey,
		baseWrappingKey,
		encapsulationPrivateKey.unwrapKey.unwrapAlgo,
		encapsulationPrivateKey.unwrapKey.unwrappedKeyAlgo,
		false,
		["deriveKey"],
	);
}

async function encapsulateKey(
	privateKey: CryptoKey,
	publicKey: EncapsulationPublicKeyInfo,
	recipient: EncapsulationKeypairInfo,
	keyToWrap: CryptoKey,
): Promise<StaticEncapsulationInfo> {
	const wrappingKeyAlgorithm: { name: "AES-KW", length: 256 } = { name: "AES-KW", length: 256 };
	const wrappingKey = await crypto.subtle.deriveKey(
		{
			name: privateKey.algorithm.name,
			public: await crypto.subtle.importKey(
				publicKey.importKey.format,
				publicKey.importKey.keyData,
				publicKey.importKey.algorithm,
				true,
				[], // Empty in Chrome; "deriveKey" in Firefox(?)
			),
		},
		privateKey,
		wrappingKeyAlgorithm,
		false,
		["wrapKey"],
	);

	const unwrappingKey: EncapsulationUnwrappingKeyInfo = {
		deriveKey: {
			algorithm: {
				name: "ECDH",
			},
			derivedKeyAlgorithm: wrappingKeyAlgorithm,
		},
	};

	const format = "raw";
	const wrapAlgo = "AES-KW";
	const wrappedKey = new Uint8Array(await crypto.subtle.wrapKey(format, keyToWrap, wrappingKey, wrapAlgo));
	return {
		keypair: recipient,
		unwrapKey: {
			wrappedKey,
			unwrappingKey,
		},
	}
}

async function decapsulateKey(
	baseWrappingKey: CryptoKey,
	ephemeralInfo: EphemeralEncapsulationInfo,
	staticInfo: StaticEncapsulationInfo,
	extractable: boolean,
	keyUsages: KeyUsage[],
): Promise<CryptoKey> {
	return await crypto.subtle.unwrapKey(
		ephemeralInfo.unwrapKey.format,
		staticInfo.unwrapKey.wrappedKey,
		await crypto.subtle.deriveKey(
			{
				name: staticInfo.unwrapKey.unwrappingKey.deriveKey.algorithm.name,
				public: await crypto.subtle.importKey(
					ephemeralInfo.publicKey.importKey.format,
					ephemeralInfo.publicKey.importKey.keyData,
					ephemeralInfo.publicKey.importKey.algorithm,
					true,
					[], // Empty in Chrome; "deriveKey" in Firefox(?)
				),
			},
			await unwrapEncapsulationPrivateKey(baseWrappingKey, staticInfo.keypair.privateKey),
			staticInfo.unwrapKey.unwrappingKey.deriveKey.derivedKeyAlgorithm,
			false,
			["unwrapKey"],
		),
		ephemeralInfo.unwrapKey.unwrapAlgo,
		ephemeralInfo.unwrapKey.unwrappedKeyAlgo,
		extractable,
		keyUsages,
	);
}

export async function unwrapKey(
	wrappingKey: CryptoKey,
	ephemeralInfo: EphemeralEncapsulationInfo | null,
	keyInfo: WrappedKeyInfo,
	extractable: boolean = false,
): Promise<CryptoKey> {
	if (isAsymmetricWrappedKeyInfo(keyInfo)) {
		return await decapsulateKey(wrappingKey, ephemeralInfo, keyInfo, extractable, ["decrypt", "wrapKey", "unwrapKey"]);
	} else {
		return await crypto.subtle.unwrapKey(
			"raw",
			keyInfo.wrappedKey,
			wrappingKey,
			keyInfo.unwrapAlgo,
			keyInfo.unwrappedKeyAlgo,
			extractable,
			["decrypt", "wrapKey", "unwrapKey"],
		);
	}
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
	return migrateV0PrivateData(
		jsonParseTaggedBinary(
			new TextDecoder().decode(
				(await jose.compactDecrypt(privateDataJwe, encryptionKey)).plaintext
			))
	);
};

async function rewrapPrivateKeys(
	privateData: PrivateData,
	fromKey: CryptoKey,
	toKey: CryptoKey,
): Promise<PrivateData> {
	const rewrappedKeys: [string, CredentialKeyPair][] = await Promise.all(
		Object.entries(privateData.keypairs).map(async ([kid, keypair]): Promise<[string, CredentialKeyPair]> => {
			if ("wrappedPrivateKey" in keypair) {
				return [
					kid,
					{
						...keypair,
						wrappedPrivateKey: await wrapPrivateKey(await unwrapPrivateKey(keypair.wrappedPrivateKey, fromKey, true), toKey),
					},
				];
			} else {
				return [kid, keypair];
			}
		})
	);
	return {
		...privateData,
		keypairs: rewrappedKeys.reduce(
			(result, [kid, keypair]) => {
				result[kid] = keypair;
				return result;
			},
			{},
		),
	};
}

async function derivePasswordKey(password: string, keyInfo: DerivePasswordKeyInfo): Promise<CryptoKey> {
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveKey"],
	);

	return await crypto.subtle.deriveKey(
		keyInfo.pbkdf2Params,
		keyMaterial,
		keyInfo.algorithm || { name: "AES-KW", length: 256 },
		true,
		["wrapKey", "unwrapKey"],
	);
};

export async function upgradePasswordKey(
	privateData: MixedEncryptedContainer,
	password: string,
	currentKeyInfo: SymmetricPasswordKeyInfo,
	currentPasswordKey: CryptoKey,
): Promise<EncryptedContainer> {
	const newDeriveKeyInfo: DerivePasswordKeyInfo = {
		pbkdf2Params: currentKeyInfo.pbkdf2Params,
		algorithm: { name: "AES-GCM", length: 256 },
	};
	const newPasswordKey = await derivePasswordKey(password, newDeriveKeyInfo);
	const mainKey = await unwrapKey(
		currentPasswordKey,
		privateData.mainKey || null,
		currentKeyInfo.mainKey,
		true,
	);
	const mainKeyInfo = privateData.mainKey || (await createAsymmetricMainKey(mainKey)).keyInfo;
	const [passwordKeypair, passwordPrivateKey] = await generateWrappedEncapsulationKeypair(newPasswordKey);
	return {
		...privateData,
		mainKey: mainKeyInfo,
		passwordKey: {
			...newDeriveKeyInfo,
			...await encapsulateKey(
				passwordPrivateKey,
				mainKeyInfo.publicKey,
				passwordKeypair,
				mainKey,
			),
		},
	};
}

async function derivePrfKey(
	prfOutput: BufferSource,
	deriveKeyParams: WebauthnPrfEncryptionKeyDeriveKeyParams,
): Promise<CryptoKey> {
	const hkdfKey = await crypto.subtle.importKey(
		"raw",
		prfOutput,
		"HKDF",
		false,
		["deriveKey"],
	);
	const { hkdfSalt, hkdfInfo, algorithm } = deriveKeyParams;

	return await crypto.subtle.deriveKey(
		{ name: "HKDF", hash: "SHA-256", salt: hkdfSalt, info: hkdfInfo },
		hkdfKey,
		algorithm || { name: "AES-KW", length: 256 },
		true,
		["wrapKey", "unwrapKey"],
	);
}

function addWebauthnRegistrationExtensionInputs(options: CredentialCreationOptions): [
	CredentialCreationOptions,
	Uint8Array,
] {
	const prfSalt = crypto.getRandomValues(new Uint8Array(32))
	return [
		{
			...options,
			publicKey: {
				...options.publicKey,
				extensions: {
					...options.publicKey.extensions,
					prf: {
						eval: {
							first: prfSalt,
						},
					},
					sign: {
						generateKey: {
							algorithms: [COSE_ALG_ESP256_ARKG],
						},
					},
				}
			},
		},
		prfSalt,
	];
}

function makeRegistrationPrfExtensionInputs(credential: PublicKeyCredential, prfSalt: BufferSource): {
	allowCredentials: PublicKeyCredentialDescriptor[],
	prfInput: AuthenticationExtensionsPRFInputs,
} {
	return {
		allowCredentials: [{
			type: "public-key",
			id: credential.rawId,
			transports: (credential.response as AuthenticatorAttestationResponse).getTransports() as AuthenticatorTransport[],
		}],
		prfInput: { eval: { first: prfSalt } },
	};
}

export function makeAssertionPrfExtensionInputs(prfKeys: WebauthnPrfSaltInfo[]): {
	allowCredentials: PublicKeyCredentialDescriptor[],
	prfInput: AuthenticationExtensionsPRFInputs,
} {
	return {
		allowCredentials: prfKeys.map(
			(keyInfo: WebauthnPrfSaltInfo) => ({
				type: "public-key",
				id: keyInfo.credentialId,
				transports: keyInfo.transports ?? [],
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

function filterPrfAllowCredentials(credential: PublicKeyCredential | null, prfInputs: PrfInputs): PrfInputs {
	if (credential) {
		return {
			allowCredentials: prfInputs?.allowCredentials?.filter(credDesc => byteArrayEquals(credDesc.id, credential.rawId)),
			prfInput: (
				"evalByCredential" in prfInputs.prfInput
					? {
						evalByCredential: filterObject(
							prfInputs.prfInput.evalByCredential,
							(_, credIdB64u) => credIdB64u === credential.id,
						),
					}
					: prfInputs.prfInput
			),
		};
	} else {
		return prfInputs;
	}
}

async function getPrfOutput(
	credential: PublicKeyCredential | null,
	prfInputs: PrfInputs,
	promptForRetry: () => Promise<boolean | AbortSignal>,
): Promise<[ArrayBuffer, PublicKeyCredential]> {
	const clientExtensionOutputs = credential?.getClientExtensionResults();
	const canRetry = !clientExtensionOutputs?.prf || clientExtensionOutputs?.prf?.enabled;

	if (credential && clientExtensionOutputs?.prf?.results?.first) {
		return [toArrayBuffer(clientExtensionOutputs?.prf?.results?.first), credential];

	} else if (canRetry) {
		const retryOrAbortSignal = await promptForRetry();
		if (retryOrAbortSignal) {
			try {
				// Restrict the PRF-retry to use the same passkey as the previous
				// authentication. Otherwise users may have to click through "use a
				// different option" dialogs twice in order to use a security key
				// instead of the platform authenticator, for example.
				const filteredPrfInputs = filterPrfAllowCredentials(credential, prfInputs);

				const retryCred = await navigator.credentials.get({
					publicKey: withHintsFromAllowCredentials({
						rpId: config.WEBAUTHN_RPID,
						challenge: crypto.getRandomValues(new Uint8Array(32)),
						allowCredentials: filteredPrfInputs?.allowCredentials,
						extensions: { prf: filteredPrfInputs.prfInput },
					}),
					signal: retryOrAbortSignal === true ? undefined : retryOrAbortSignal,
				}) as PublicKeyCredential;
				return await getPrfOutput(retryCred, prfInputs, async () => false);
			} catch (err) {
				if (err instanceof DOMException && err.name === "NotAllowedError") {
					throw new Error("Failed to evaluate PRF", { cause: { errorId: "prf_retry_failed", credential, err } });
				} else {
					throw new Error("Failed to evaluate PRF", { cause: err });
				}
			}

		} else {
			throw new Error("Canceled by user", { cause: { errorId: "canceled" } });
		}

	} else {
		throw new Error("Browser or authenticator does not support PRF", { cause: { errorId: "prf_not_supported" } });
	}
}

async function createPrfKey(
	credential: PublicKeyCredential,
	prfSalt: Uint8Array,
	mainKeyInfo: EphemeralEncapsulationInfo,
	mainKey: CryptoKey,
	promptForPrfRetry: () => Promise<boolean | AbortSignal>,
): Promise<WebauthnPrfEncryptionKeyInfoV2> {
	const [prfOutput,] = await getPrfOutput(
		credential,
		makeRegistrationPrfExtensionInputs(credential, prfSalt),
		promptForPrfRetry,
	);
	const hkdfSalt = crypto.getRandomValues(new Uint8Array(32));
	const hkdfInfo = new TextEncoder().encode("eDiplomas PRF");
	const algorithm = { name: "AES-GCM", length: 256 };
	const deriveKeyParams = { hkdfSalt, hkdfInfo, algorithm };
	const prfKey = await derivePrfKey(prfOutput, deriveKeyParams);
	const [prfKeypair, prfPrivateKey] = await generateWrappedEncapsulationKeypair(prfKey);

	const keyInfo: WebauthnPrfEncryptionKeyInfoV2 = {
		credentialId: new Uint8Array(credential.rawId),
		transports: (credential.response as AuthenticatorAttestationResponse).getTransports() as AuthenticatorTransport[],
		prfSalt,
		...deriveKeyParams,
		...await encapsulateKey(prfPrivateKey, mainKeyInfo.publicKey, prfKeypair, mainKey),
	};
	return keyInfo;
}

export async function getPrfKey(
	privateData: EncryptedContainer,
	credential: PublicKeyCredential | null,
	promptForPrfRetry: () => Promise<boolean | AbortSignal>,
): Promise<[CryptoKey, WebauthnPrfEncryptionKeyInfo, PublicKeyCredential]> {
	const [prfOutput, prfCredential] = await getPrfOutput(
		credential,
		makeAssertionPrfExtensionInputs(privateData.prfKeys),
		promptForPrfRetry,
	);
	const keyInfo = privateData.prfKeys.find(keyInfo => toBase64Url(keyInfo.credentialId) === prfCredential.id);
	if (keyInfo === undefined) {
		throw new Error("PRF key not found");
	}
	return [await derivePrfKey(prfOutput, keyInfo), keyInfo, prfCredential];
}

async function addNewArkgSeedKeypair(
	credential: PublicKeyCredential | null,
	prfCredential: PublicKeyCredential | null,
	mainKey: CryptoKey,
	privateData: EncryptedContainer,
): Promise<EncryptedContainer> {
	const newArkgSeed = parseArkgSeedKeypair(credential) ?? parseArkgSeedKeypair(prfCredential);
	if (newArkgSeed) {
		const [newPrivateData,] = await updatePrivateData(
			[privateData as AsymmetricEncryptedContainer, mainKey],
			async (privateData: PrivateData, _updateWrappedPrivateKey) => ({
				...privateData,
				arkgSeeds: [
					...(privateData.arkgSeeds ?? []),
					newArkgSeed,
				],
			}),
		);
		return newPrivateData;

	} else {
		return privateData;
	}
}

export async function upgradePrfKey(
	privateData: EncryptedContainer,
	credential: PublicKeyCredential | null,
	prfKeyInfo: WebauthnPrfEncryptionKeyInfoV1,
	promptForPrfRetry: () => Promise<boolean | AbortSignal>,
): Promise<EncryptedContainer> {
	const [prfKey, , prfCredential] = await getPrfKey(
		{
			...privateData,
			prfKeys: privateData.prfKeys.filter((keyInfo) => (
				toBase64Url(keyInfo.credentialId) === toBase64Url(prfKeyInfo.credentialId)
			)),
		},
		credential,
		promptForPrfRetry,
	);

	const mainKey = await unwrapKey(prfKey, null, prfKeyInfo.mainKey, true);
	const mainKeyInfo = privateData.mainKey || (await createAsymmetricMainKey(mainKey)).keyInfo;

	const newPrivateData = {
		...privateData,
		mainKey: mainKeyInfo,
		prfKeys: await Promise.all(privateData.prfKeys.map(async prfKeyItem => {
			if (toBase64Url(prfKeyItem.credentialId) === prfCredential.id) {
				const newPrfKeyInfo = await createPrfKey(
					prfCredential,
					prfKeyInfo.prfSalt,
					mainKeyInfo,
					mainKey,
					async () => false,
				);
				return newPrfKeyInfo;
			} else {
				return prfKeyItem;
			}
		})),
	};

	return addNewArkgSeedKeypair(credential, prfCredential, mainKey, newPrivateData);
};

export async function beginAddPrf(createOptions: CredentialCreationOptions): Promise<PrecreatedPublicKeyCredential> {
	const [options, prfSalt] = addWebauthnRegistrationExtensionInputs(createOptions)
	const credential = await navigator.credentials.create(options) as PublicKeyCredentialCreation;
	return { credential, prfSalt };
}

export async function finishAddPrf(
	privateData: EncryptedContainer,
	credential: PrecreatedPublicKeyCredential,
	[existingUnwrapKey, wrappedMainKey]: [CryptoKey, WrappedKeyInfo],
	promptForPrfRetry: () => Promise<boolean | AbortSignal>,
): Promise<EncryptedContainer> {
	const mainKey = await unwrapKey(existingUnwrapKey, privateData.mainKey, wrappedMainKey, true);
	const mainKeyInfo = privateData.mainKey || (await createAsymmetricMainKey(mainKey)).keyInfo;

	const keyInfo = await createPrfKey(
		credential.credential,
		credential.prfSalt,
		mainKeyInfo,
		mainKey,
		promptForPrfRetry,
	);

	const newPrivateData = {
		...privateData,
		prfKeys: [
			...privateData.prfKeys,
			keyInfo,
		],
	};
	return addNewArkgSeedKeypair(credential.credential, null, mainKey, newPrivateData);
}

export function deletePrf(privateData: EncryptedContainer, credentialId: Uint8Array): EncryptedContainer {
	return {
		...privateData,
		prfKeys: privateData.prfKeys.filter((keyInfo) => (
			toBase64Url(keyInfo.credentialId) !== toBase64Url(credentialId)
		)),
	};
}

export type UnlockSuccess = {
	exportedMainKey: ArrayBuffer,
	privateData: EncryptedContainer,
}
export async function unlock(mainKey: CryptoKey, privateData: EncryptedContainer): Promise<UnlockSuccess> {
	await decryptPrivateData(privateData.jwe, mainKey); // Throw error if decryption fails
	const exportedMainKey = await exportMainKey(mainKey);
	return {
		exportedMainKey,
		privateData,
	};
}

export async function getPasswordKey(privateData: EncryptedContainer, password: string): Promise<[CryptoKey, PasswordKeyInfo]> {
	const keyInfo = privateData.passwordKey;
	if (keyInfo === undefined) {
		throw new Error("Password key not found");
	}
	const passwordKey = await derivePasswordKey(password, keyInfo);

	// Throw an error if the password is incorrect
	await unwrapKey(
		passwordKey,
		privateData.mainKey,
		isAsymmetricPasswordKeyInfo(keyInfo) ? keyInfo : keyInfo.mainKey,
	);

	return [passwordKey, keyInfo];
};

export async function unlockPassword(
	privateData: EncryptedContainer,
	password: string,
): Promise<[UnlockSuccess, EncryptedContainer | null]> {
	const keyInfo = privateData.passwordKey;
	if (keyInfo === undefined) {
		throw new Error("Password key not found");
	}
	const passwordKey = await derivePasswordKey(password, keyInfo);
	const mainKey = isAsymmetricPasswordKeyInfo(keyInfo)
		? await decapsulateKey(passwordKey, privateData.mainKey, keyInfo, true, ["decrypt", "unwrapKey"])
		: await unwrapKey(passwordKey, null, keyInfo.mainKey, true);

	const newPrivateData = (
		isAsymmetricPasswordKeyInfo(keyInfo)
			? null
			: await upgradePasswordKey(privateData, password, keyInfo, passwordKey)
	);

	return [await unlock(mainKey, privateData), newPrivateData];
};

export async function unlockPrf(
	privateData: EncryptedContainer,
	credential: PublicKeyCredential,
	promptForPrfRetry: () => Promise<boolean | AbortSignal>,
): Promise<[UnlockSuccess, EncryptedContainer | null]> {
	const [prfKey, keyInfo, prfCredential] = await getPrfKey(privateData, credential, promptForPrfRetry);
	const mainKey = isPrfKeyV2(keyInfo)
		? await decapsulateKey(prfKey, privateData.mainKey, keyInfo, true, ["decrypt", "unwrapKey"])
		: await unwrapKey(prfKey, null, keyInfo.mainKey, true);

	const newPrivateData = (
		isPrfKeyV2(keyInfo)
			? null
			: await upgradePrfKey(privateData, prfCredential, keyInfo, promptForPrfRetry)
	);

	return [await unlock(mainKey, privateData), newPrivateData];
}

export async function init(
	mainKey: CryptoKey,
	keyInfo: AsymmetricEncryptedContainerKeys,
	credential: PublicKeyCredentialCreation | null,
): Promise<UnlockSuccess> {
	const arkgSeed = credential ? parseArkgSeedKeypair(credential) : null;
	const privateData: EncryptedContainer = {
		...keyInfo,
		jwe: await encryptPrivateData({
			keypairs: {},
			arkgSeeds: (arkgSeed ? [arkgSeed] : []),
		}, mainKey),
	};
	return await unlock(mainKey, privateData);
}

export async function initPassword(
	password: string,
	options?: { pbkdfIterations: number },
): Promise<{ mainKey: CryptoKey, keyInfo: AsymmetricEncryptedContainerKeys }> {
	const pbkdf2Params: Pbkdf2Params = {
		name: "PBKDF2",
		hash: pbkdfHash,
		iterations: options?.pbkdfIterations ?? pbkdfIterations,
		salt: crypto.getRandomValues(new Uint8Array(32)),
	};
	const deriveKeyInfo: DerivePasswordKeyInfo = {
		pbkdf2Params,
		algorithm: { name: "AES-GCM", length: 256 },
	};
	const passwordKey = await derivePasswordKey(password, deriveKeyInfo);
	const [passwordKeypair, passwordPrivateKey] = await generateWrappedEncapsulationKeypair(passwordKey);
	const mainKeyInfo = await createAsymmetricMainKey();
	const passwordKeyInfo = {
		...deriveKeyInfo,
		...await encapsulateKey(passwordPrivateKey, mainKeyInfo.keyInfo.publicKey, passwordKeypair, mainKeyInfo.mainKey)
	};

	return {
		mainKey: mainKeyInfo.mainKey,
		keyInfo: {
			mainKey: mainKeyInfo.keyInfo,
			passwordKey: passwordKeyInfo,
			prfKeys: [],
		},
	};
}

async function createPublicKeyCredentialIfNeeded(
	credentialOrCreateOptions: PrecreatedPublicKeyCredential | CredentialCreationOptions,
): Promise<PrecreatedPublicKeyCredential> {
	if ("credential" in credentialOrCreateOptions) {
		return credentialOrCreateOptions;

	} else {
		const [createOptions, prfSalt] = addWebauthnRegistrationExtensionInputs(credentialOrCreateOptions)
		return {
			credential: await navigator.credentials.create(createOptions) as PublicKeyCredentialCreation,
			prfSalt,
		};
	}
}

export async function initWebauthn(
	credentialOrCreateOptions: PrecreatedPublicKeyCredential | CredentialCreationOptions,
	promptForPrfRetry: () => Promise<boolean | AbortSignal>,
): Promise<{
	credential: PublicKeyCredentialCreation,
	mainKey: CryptoKey,
	keyInfo: AsymmetricEncryptedContainerKeys,
}> {
	const { credential, prfSalt } = await createPublicKeyCredentialIfNeeded(credentialOrCreateOptions);
	const mainKeyInfo = await createAsymmetricMainKey();
	const keyInfo = await createPrfKey(
		credential,
		prfSalt,
		mainKeyInfo.keyInfo,
		mainKeyInfo.mainKey,
		promptForPrfRetry,
	);
	return {
		credential,
		mainKey: mainKeyInfo.mainKey,
		keyInfo: {
			mainKey: mainKeyInfo.keyInfo,
			prfKeys: [keyInfo],
		},
	};
}

async function compressPublicKey(uncompressedRawPublicKey: Uint8Array): Promise<Uint8Array> {
	// Check if the uncompressed public key has the correct length
	if (uncompressedRawPublicKey.length !== 65 || uncompressedRawPublicKey[0] !== 0x04) {
		throw new Error('Invalid uncompressed public key format');
	}

	// Get the x-coordinate
	const x = uncompressedRawPublicKey.subarray(1, 33) as any;
	const y = uncompressedRawPublicKey.subarray(33, 65) as any;
	// Determine the parity (odd or even) from the last byte
	const parity = y % 2 === 0 ? 0x02 : 0x03;

	// Create the compressed public key by concatenating the x-coordinate and the parity byte
	const compressedPublicKey = new Uint8Array([parity, ...x]);

	return compressedPublicKey;
}

async function createW3CDID(publicKey: CryptoKey): Promise<{ didKeyString: string }> {
	const rawPublicKey = new Uint8Array(await crypto.subtle.exportKey("raw", publicKey));
	const compressedPublicKeyBytes = await compressPublicKey(rawPublicKey)
	// Concatenate keyType and publicKey Uint8Arrays
	const multicodecPublicKey = new Uint8Array(2 + compressedPublicKeyBytes.length);
	varint.encodeTo(0x1200, multicodecPublicKey, 0);

	multicodecPublicKey.set(compressedPublicKeyBytes, 2);

	// Base58-btc encode the multicodec public key
	const base58EncodedPublicKey = base58btc.encode(multicodecPublicKey);

	// Construct the did:key string
	const didKeyString = `did:key:${base58EncodedPublicKey}`;

	const doc = await didResolver.resolve(didKeyString);
	if (doc.didDocument == null) {
		throw new Error("Failed to resolve the generated DID");
	}
	return { didKeyString };
}

async function generateCredentialKeypair(
	[encryptedContainer, mainKey]: OpenedContainer,
): Promise<[
	CryptoKey,
	[CryptoKey, { wrappedPrivateKey: WrappedPrivateKey } | { externalPrivateKey: WebauthnSignKeyRef }],
]> {
	const [privateData,] = await openPrivateData(mainKey, encryptedContainer);
	if (privateData?.arkgSeeds?.length > 0) {
		const { arkgSeeds } = privateData;
		if (arkgSeeds.length > 1) {
			throw new Error("Unimplemented: More than one ARKG seed available");
		}

		const [arkgSeed] = arkgSeeds;
		const arkgInstance = arkg.getCoseEcInstance(arkgSeed.publicSeed.alg);
		const arkgIkm = crypto.getRandomValues(new Uint8Array(32));
		const arkgCtx = new TextEncoder().encode('wwwallet credential');
		const [pkPoint, arkgKeyHandle] = await arkgInstance.derivePublicKey(
			await arkg.ecPublicKeyFromCose(arkgSeed.publicSeed),
			arkgIkm,
			arkgCtx,
		);
		const publicKey = await ec.publicKeyFromPoint("ECDSA", "P-256", pkPoint);
		const externalPrivateKey: WebauthnSignKeyRef = {
			credentialId: arkgSeed.credentialId,
			keyRef: new Uint8Array(webauthn.encodeCoseKeyRefArkgDerived({
				kty: COSE_KTY_ARKG_DERIVED,
				kid: arkgSeed.publicSeed.kid,
				alg: COSE_ALG_ESP256_ARKG,
				kh: new Uint8Array(arkgKeyHandle),
				info: arkgCtx,
			})),
		};
		return [publicKey, [null /* TODO: Remove assumption that private key will be returned */, { externalPrivateKey }]];

	} else {
		const { publicKey, privateKey } = await crypto.subtle.generateKey(
			{ name: "ECDSA", namedCurve: "P-256" },
			true,
			['sign']
		);
		const wrappedPrivateKey = await wrapPrivateKey(privateKey, mainKey);
		return [publicKey, [privateKey, { wrappedPrivateKey }]];
	}
}

async function addNewCredentialKeypairs(
	[privateData, mainKey]: OpenedContainer,
	didKeyVersion: DidKeyVersion,
	deriveKid: (publicKey: CryptoKey, did: string) => Promise<string>,
	numberOfKeyPairs: number = 1
): Promise<{
	privateKeys: CryptoKey[],
	keypairs: CredentialKeyPair[],
	newPrivateData: OpenedContainer,
}> {

	const keypairsWithPrivateKeys = await Promise.all(Array.from({ length: numberOfKeyPairs }).map(async () => {
		const [publicKey, [privateKey, wrappedPrivateKeyOrRef]] = await generateCredentialKeypair([privateData, mainKey]);
		const publicKeyJwk: JWK = await crypto.subtle.exportKey("jwk", publicKey) as JWK;
		const did = await createDid(publicKey, didKeyVersion);
		const kid = await deriveKid(publicKey, did);

		const keypair: CredentialKeyPair = {
			kid,
			did,
			alg: "ES256",
			publicKey: publicKeyJwk,
			...wrappedPrivateKeyOrRef,
		};

		return { kid, keypair, privateKey };
	}));



	console.log("addNewredentialKeypair: Before update private data")
	return {
		privateKeys: keypairsWithPrivateKeys.map((k) => k.privateKey),
		keypairs: keypairsWithPrivateKeys.map((k) => k.keypair),
		newPrivateData: await updatePrivateData(
			[privateData, mainKey],
			async (privateData: PrivateData) => {

				const combinedKeypairs = {
					...privateData.keypairs
				};

				for (const { kid, keypair } of keypairsWithPrivateKeys) {
					combinedKeypairs[kid] = keypair;
				}
				return {
					...privateData,
					keypairs: {
						...combinedKeypairs
					},
				}
			}
		),
	};
}

async function createDid(publicKey: CryptoKey, didKeyVersion: DidKeyVersion): Promise<string> {
	if (didKeyVersion === "p256-pub") {
		const { didKeyString } = await createW3CDID(publicKey);
		return didKeyString;
	} else if (didKeyVersion === "jwk_jcs-pub") {
		const publicKeyJwk = await crypto.subtle.exportKey("jwk", publicKey);
		return didUtil.createDid(publicKeyJwk as JWK);
	}
}

export async function signJwtPresentation(
	[privateData, mainKey]: [PrivateData, CryptoKey],
	nonce: string,
	audience: string,
	verifiableCredentials: any[],
	transactionDataResponseParams?: { transaction_data_hashes: string[], transaction_data_hashes_alg: string[] },
	uiStateMachine: UiStateMachineFunction,
): Promise<{ vpjwt: string }> {
	const hasher = (data: string | ArrayBuffer, alg: string) => {
		const encoded =
			typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);

		return crypto.subtle.digest(alg, encoded).then((v) => new Uint8Array(v));
	}

	const inputJwt = await SDJwt.fromEncode(verifiableCredentials[0], hasher);
	const { cnf } = inputJwt.jwt.payload as { cnf?: { jwk?: JWK } };

	if (!cnf?.jwk) {
		throw new Error("Holder public key could not be resolved from cnf.jwk attribute");
	}

	const kid = await jose.calculateJwkThumbprint(cnf.jwk, "sha256");

	const keypair = privateData.keypairs[kid];
	if (!keypair) {
		throw new Error("Key pair not found for kid (key ID): " + kid);
	}

	const { alg } = keypair;
	const sdJwt = verifiableCredentials[0];
	const sd_hash = toBase64Url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sdJwt)));

	const performSignature = async (signJwt: SignJWT, keypair: CredentialKeyPair) => {
		if ("wrappedPrivateKey" in keypair) {
			const { wrappedPrivateKey } = keypair;
			const privateKey = await unwrapPrivateKey(wrappedPrivateKey, mainKey);
			return signJwt.sign(privateKey);

		} else {
			return signJwt.sign(
				null as jose.KeyLike,
				{ signFunction: makeWebauthnSignFunction(config.WEBAUTHN_RPID, keypair, uiStateMachine) },
			);
		}
	}

	const signJwt = new SignJWT({
		nonce,
		aud: audience,
		sd_hash,
		...transactionDataResponseParams,
	}).setIssuedAt()
		.setProtectedHeader({
			typ: "kb+jwt",
			alg: alg
		});
	const kbJWT = await performSignature(signJwt, keypair);

	const jws = sdJwt + kbJWT;
	return { vpjwt: jws };
}

export async function generateOpenid4vciProofs(
	container: OpenedContainer,
	didKeyVersion: DidKeyVersion,
	nonce: string,
	audience: string,
	issuer: string,
	setupUiStateMachine: (i: number) => UiStateMachineFunction,
	numberOfKeyPairs: number = 1,
): Promise<[{ proof_jwts: string[] }, OpenedContainer]> {
	const deriveKid = async (publicKey: CryptoKey) => {
		const pubKey = await crypto.subtle.exportKey("jwk", publicKey);
		const jwkThumbprint = await jose.calculateJwkThumbprint(pubKey as JWK, "sha256");
		return jwkThumbprint;
	};
	const { privateKeys, newPrivateData, keypairs } = await addNewCredentialKeypairs(container, didKeyVersion, deriveKid, numberOfKeyPairs);

	const proof_jwts = await sequentialAll(keypairs.map((keypair, index) => {
		return async () => {
			const privateKey = privateKeys[index];
			const moveUiStateMachine = setupUiStateMachine(index);
			const performSignature = async (signJwt: SignJWT, privateKey: CryptoKey, keypair: CredentialKeyPair) => {
				if (privateKey) {
					return signJwt.sign(privateKey);

				} else if ("externalPrivateKey" in keypair) {
					return signJwt.sign(
						null as jose.KeyLike,
						{ signFunction: makeWebauthnSignFunction(config.WEBAUTHN_RPID, keypair, moveUiStateMachine) },
					);

				} else {
					throw new Error("Failed to determine private signing key for new credential keypair");
				}
			}

			const signJwt = new SignJWT({
				nonce: nonce,
				aud: audience,
				iss: issuer,
			})
				.setIssuedAt()
				.setProtectedHeader({
					alg: keypair.alg,
					typ: "openid4vci-proof+jwt",
					jwk: { ...keypair.publicKey, kid: keypair.kid, key_ops: ['verify'] } as JWK,
				});

			const jws = await performSignature(signJwt, privateKey, keypair);
			moveUiStateMachine({ id: 'success:dismiss' });

			return jws;
		}
	}));

	return [{ proof_jwts: proof_jwts }, newPrivateData];
}


export async function generateKeypairs(
	container: OpenedContainer,
	didKeyVersion: DidKeyVersion,
	numberOfKeyPairs: number = 1
): Promise<[{ keypairs: CredentialKeyPair[] }, OpenedContainer]> {
	const deriveKid = async (publicKey: CryptoKey) => {
		const pubKey = await crypto.subtle.exportKey("jwk", publicKey);
		const jwkThumbprint = await jose.calculateJwkThumbprint(pubKey as JWK, "sha256");
		return jwkThumbprint;
	};
	const { newPrivateData, keypairs } = await addNewCredentialKeypairs(container, didKeyVersion, deriveKid, numberOfKeyPairs);
	return [{ keypairs }, newPrivateData];
}

export async function generateDeviceResponse([privateData, mainKey]: [PrivateData, CryptoKey], mdocCredential: MDoc, presentationDefinition: any, mdocGeneratedNonce: string, verifierGeneratedNonce: string, clientId: string, responseUri: string): Promise<{ deviceResponseMDoc: MDoc }> {

	const getSessionTranscriptBytesForOID4VP = async (clId: string, respUri: string, nonce: string, mdocNonce: string) => cborEncode(
		DataItem.fromData(
			[
				null,
				null,
				[
					await crypto.subtle.digest(
						'SHA-256',
						cborEncode([clId, mdocNonce]),
					),
					await crypto.subtle.digest(
						'SHA-256',
						cborEncode([respUri, mdocNonce]),
					),
					nonce
				]
			]
		)
	);
	// extract the COSE device public key from mdoc
	const p: DataItem = cborDecode(mdocCredential.documents[0].issuerSigned.issuerAuth.payload);
	const deviceKeyInfo = p.data.get('deviceKeyInfo');
	const deviceKey = deviceKeyInfo.get('deviceKey');
	console.log("Device key = ", deviceKey);

	// @ts-ignore
	const devicePublicKeyJwk = COSEKeyToJWK(deviceKey);
	const kid = await jose.calculateJwkThumbprint(devicePublicKeyJwk, "sha256");
	console.log("KID = ", kid)
	// get the keypair based on the jwk Thumbprint
	const keypair = privateData.keypairs[kid];
	console.log("Found keypair = ", keypair);
	if (!keypair) {
		throw new Error("Key pair not found for kid (key ID): " + kid);
	}

	const { alg, wrappedPrivateKey } = keypair;
	const privateKey = await unwrapPrivateKey(wrappedPrivateKey, mainKey, true);
	const privateKeyJwk = await crypto.subtle.exportKey("jwk", privateKey);

	console.log("mdocGeneratedNonce = ", mdocGeneratedNonce);
	console.log("verifierGeneratedNonce = ", verifierGeneratedNonce);
	console.log("clientId = ", clientId);
	console.log("responseUri = ", responseUri);

	const sessionTranscriptBytes = await getSessionTranscriptBytesForOID4VP(
		clientId,
		responseUri,
		verifierGeneratedNonce,
		mdocGeneratedNonce
	);

	const uint8ArrayToHexString = (uint8Array: any) => Array.from(uint8Array, byte => byte.toString(16).padStart(2, '0')).join('');
	console.log("Session transcript bytes (HEX): ", uint8ArrayToHexString(new Uint8Array(sessionTranscriptBytes)));

	const deviceResponseMDoc = await DeviceResponse.from(mdocCredential)
		.usingPresentationDefinition(presentationDefinition)
		.usingSessionTranscriptBytes(sessionTranscriptBytes)
		.authenticateWithSignature({ ...privateKeyJwk, alg, kid } as JWK, alg as SupportedAlgs)
		.sign();
	return { deviceResponseMDoc };
}

export async function generateDeviceResponseWithProximity([privateData, mainKey]: [PrivateData, CryptoKey], mdocCredential: MDoc, presentationDefinition: any, sessionTranscriptBytes: any): Promise<{ deviceResponseMDoc: MDoc }> {
	// extract the COSE device public key from mdoc
	const p: DataItem = cborDecode(mdocCredential.documents[0].issuerSigned.issuerAuth.payload);
	const deviceKeyInfo = p.data.get('deviceKeyInfo');
	const deviceKey = deviceKeyInfo.get('deviceKey');

	const devicePublicKeyJwk = COSEKeyToJWK(deviceKey);
	const kid = await jose.calculateJwkThumbprint(devicePublicKeyJwk, "sha256");

	// get the keypair based on the jwk Thumbprint
	const keypair = privateData.keypairs[kid];
	if (!keypair) {
		throw new Error("Key pair not found for kid (key ID): " + kid);
	}

	const { alg, did, wrappedPrivateKey } = keypair;
	const privateKey = await unwrapPrivateKey(wrappedPrivateKey, mainKey, true);
	const privateKeyJwk = await crypto.subtle.exportKey("jwk", privateKey);

	const options = getCborEncodeDecodeOptions();
	options.variableMapSize = true;
	setCborEncodeDecodeOptions(options);

	const deviceResponseMDoc = await DeviceResponse.from(mdocCredential)
		.usingPresentationDefinition(presentationDefinition)
		.usingSessionTranscriptBytes(sessionTranscriptBytes)
		.authenticateWithSignature({ ...privateKeyJwk, alg, kid } as JWK, alg as SupportedAlgs)
		.sign();
	return { deviceResponseMDoc };
}

function parseArkgSeedKeypair(credential: PublicKeyCredential | null): WebauthnSignArkgPublicSeed | null {
	const generatedKey = credential?.getClientExtensionResults()?.sign?.generatedKey;
	if (generatedKey) {
		return {
			credentialId: new Uint8Array(credential.rawId),
			publicSeed: parseCoseKeyArkgPubSeed(cbor.decodeFirstSync(generatedKey.publicKey)),
		};
	} else {
		return null;
	}
}
