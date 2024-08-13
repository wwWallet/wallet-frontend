import * as jose from "jose";
import { JWK, SignJWT } from "jose";
import { base58btc } from 'multiformats/bases/base58';
import { varint } from 'multiformats';
import * as KeyDidResolver from 'key-did-resolver'
import { Resolver } from 'did-resolver'
import { v4 as uuidv4 } from "uuid";
import * as didUtil from "@cef-ebsi/key-did-resolver/dist/util.js";
import { SignVerifiablePresentationJWT } from "@wwwallet/ssi-sdk";

import * as config from '../config';
import type { DidKeyVersion } from '../config';
import { jsonParseTaggedBinary, jsonStringifyTaggedBinary, toBase64Url } from "../util";
import { SdJwt } from "@sd-jwt/core";


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

export type WebauthnPrfSaltInfo = {
	credentialId: Uint8Array,
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

type PrfExtensionInput = { eval: { first: BufferSource } } | { evalByCredential: PrfEvalByCredential };
type PrfEvalByCredential = { [credentialId: string]: { first: BufferSource } };
type PrfExtensionOutput = { enabled: boolean, results?: { first?: ArrayBuffer } };

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

export type CredentialKeyPair = {
	kid: string,
	did: string,
	alg: string,
	publicKey: JWK,
	wrappedPrivateKey: WrappedPrivateKey,
}

type WrappedPrivateKey = {
	privateKey: BufferSource,
	aesGcmParams: AesGcmParams,
	unwrappedKeyAlgo: EcKeyImportParams,
}

export type PrivateData = {
	keypairs: {
		[kid: string]: CredentialKeyPair,
	},
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
		["decrypt", "encrypt", "wrapKey"],
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

export async function openPrivateData(exportedMainKey: BufferSource, privateData: EncryptedContainer): Promise<[PrivateData, CryptoKey]> {
	const mainKey = await importMainKey(exportedMainKey);
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
		Object.entries(privateData.keypairs).map(async ([kid, keypair]): Promise<[string, CredentialKeyPair]> => [
			kid,
			{
				...keypair,
				wrappedPrivateKey: await wrapPrivateKey(await unwrapPrivateKey(keypair.wrappedPrivateKey, fromKey, true), toKey),
			},
		])
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

function makeRegistrationPrfExtensionInputs(credential: PublicKeyCredential, prfSalt: BufferSource): {
	allowCredentials: PublicKeyCredentialDescriptor[],
	prfInput: PrfExtensionInput,
} {
	return {
		allowCredentials: [{ type: "public-key", id: credential.rawId }],
		prfInput: { eval: { first: prfSalt } },
	};
}

export function makeAssertionPrfExtensionInputs(prfKeys: WebauthnPrfSaltInfo[]): {
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
	prfInputs: { allowCredentials?: PublicKeyCredentialDescriptor[], prfInput: PrfExtensionInput },
	promptForRetry: () => Promise<boolean | AbortSignal>,
): Promise<[ArrayBuffer, PublicKeyCredential]> {
	const clientExtensionOutputs = credential?.getClientExtensionResults() as { prf?: PrfExtensionOutput } | null;
	const canRetry = !clientExtensionOutputs?.prf || clientExtensionOutputs?.prf?.enabled;

	if (credential && clientExtensionOutputs?.prf?.results?.first) {
		return [clientExtensionOutputs?.prf?.results?.first, credential];

	} else if (canRetry) {
		const retryOrAbortSignal = await promptForRetry();
		if (retryOrAbortSignal) {
			try {
				const retryCred = await navigator.credentials.get({
					publicKey: {
						rpId: config.WEBAUTHN_RPID,
						challenge: crypto.getRandomValues(new Uint8Array(32)),
						allowCredentials: prfInputs?.allowCredentials,
						extensions: { prf: prfInputs.prfInput } as AuthenticationExtensionsClientInputs,
					},
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

export async function upgradePrfKey(
	privateData: EncryptedContainer,
	credential: PublicKeyCredential | null,
	prfKeyInfo: WebauthnPrfEncryptionKeyInfoV1,
	promptForPrfRetry: () => Promise<boolean | AbortSignal>,
): Promise<EncryptedContainer> {
	const [prfKey,, prfCredential] = await getPrfKey(
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

	return newPrivateData;
};

export async function addPrf(
	privateData: EncryptedContainer,
	credential: PublicKeyCredential,
	[existingUnwrapKey, wrappedMainKey]: [CryptoKey, WrappedKeyInfo],
	promptForPrfRetry: () => Promise<boolean | AbortSignal>,
): Promise<EncryptedContainer> {
	const prfSalt = crypto.getRandomValues(new Uint8Array(32))
	const mainKey = await unwrapKey(existingUnwrapKey, privateData.mainKey, wrappedMainKey, true);
	const mainKeyInfo = privateData.mainKey || (await createAsymmetricMainKey(mainKey)).keyInfo;

	const keyInfo = await createPrfKey(
		credential,
		prfSalt,
		mainKeyInfo,
		mainKey,
		promptForPrfRetry,
	);
	return {
		...privateData,
		prfKeys: [
			...privateData.prfKeys,
			keyInfo,
		],
	};
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
): Promise<UnlockSuccess> {
	const privateData: EncryptedContainer = {
		...keyInfo,
		jwe: await encryptPrivateData({ keypairs: {} }, mainKey),
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

export async function initPrf(
	credential: PublicKeyCredential,
	prfSalt: Uint8Array,
	promptForPrfRetry: () => Promise<boolean | AbortSignal>,
): Promise<{ mainKey: CryptoKey, keyInfo: AsymmetricEncryptedContainerKeys }> {
	const mainKeyInfo = await createAsymmetricMainKey();
	const keyInfo = await createPrfKey(
		credential,
		prfSalt,
		mainKeyInfo.keyInfo,
		mainKeyInfo.mainKey,
		promptForPrfRetry,
	);
	return {
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

async function addNewCredentialKeypair(
	[privateData, mainKey]: OpenedContainer,
	didKeyVersion: DidKeyVersion,
	deriveKid: (publicKey: CryptoKey, did: string) => Promise<string>,
): Promise<{
	privateKey: CryptoKey,
	keypair: CredentialKeyPair,
	newPrivateData: OpenedContainer,
}> {
	const { publicKey, privateKey } = await crypto.subtle.generateKey(
		{ name: "ECDSA", namedCurve: "P-256" },
		true,
		['sign']
	);
	const publicKeyJwk: JWK = await crypto.subtle.exportKey("jwk", publicKey) as JWK;
	const wrappedPrivateKey = await wrapPrivateKey(privateKey, mainKey);
	const did = await createDid(publicKey, didKeyVersion);
	const kid = await deriveKid(publicKey, did);

	const keypair: CredentialKeyPair = {
		kid,
		did,
		alg: "ES256",
		publicKey: publicKeyJwk,
		wrappedPrivateKey,
	};

	return {
		privateKey,
		keypair,
		newPrivateData: await updatePrivateData(
			[privateData, mainKey],
			async (privateData: PrivateData) => ({
				...privateData,
				keypairs: {
					...privateData.keypairs,
					[kid]: keypair,
				},
			}),
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

export async function signJwtPresentation([privateData, mainKey]: [PrivateData, CryptoKey], nonce: string, audience: string, verifiableCredentials: any[]): Promise<{ vpjwt: string }> {
	const inputJwt = SdJwt.fromCompact(verifiableCredentials[0]);
	const sub = inputJwt.payload?.sub as string;
	const kid = sub;

	const keypair = privateData.keypairs[kid];
	if (!keypair) {
		throw new Error("Key pair not found for kid (key ID): " + kid);
	}
	const { alg, did, wrappedPrivateKey } = keypair;
	const privateKey = await unwrapPrivateKey(wrappedPrivateKey, mainKey);

	const jws = await new SignVerifiablePresentationJWT()
		.setProtectedHeader({ alg, typ: "JWT", kid })
		.setVerifiableCredential(verifiableCredentials)
		.setContext(["https://www.w3.org/2018/credentials/v1"])
		.setType(["VerifiablePresentation"])
		.setAudience(audience)
		.setCredentialSchema(
			config.verifiablePresentationSchemaURL,
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
}

export async function generateOpenid4vciProof(
	container: OpenedContainer,
	didKeyVersion: DidKeyVersion,
	nonce: string,
	audience: string
): Promise<[{ proof_jwt: string }, OpenedContainer]> {
	const deriveKid = async (publicKey: CryptoKey, did: string) => did;
	const { privateKey, keypair, newPrivateData } = await addNewCredentialKeypair(container, didKeyVersion, deriveKid);
	const { kid, did } = keypair;

	const jws = await new SignJWT({ nonce: nonce })
		.setProtectedHeader({
			alg: keypair.alg,
			typ: "openid4vci-proof+jwt",
			kid,
		})
		.setIssuedAt()
		.setIssuer(did)
		.setAudience(audience)
		.setExpirationTime('1m')
		.sign(privateKey);
	return [{ proof_jwt: jws }, newPrivateData];
}
