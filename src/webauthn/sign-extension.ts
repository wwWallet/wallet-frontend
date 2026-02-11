/// Sign extension v3: https://yubicolabs.github.io/webauthn-sign-extension/3/#sctn-sign-extension

import * as cbor from 'cbor-web';
import { COSE_ALG_ESP256_ARKG, COSE_KTY_ARKG_DERIVED, COSE_KTY_ARKG_PUB, encodeCoseKeyRefArkgDerived, parseCoseKey, ParsedCOSEKeyArkgPubSeed } from 'wallet-common/dist/cose';
import * as arkg from "wallet-common/dist/arkg";
import * as ec from "wallet-common/dist/arkg/ec";

import { toBase64Url } from '@/util';
import { parseAuthenticatorData } from '@/webauthn';


export interface AuthenticationExtensionsSignInputs {
	generateKey?: AuthenticationExtensionsSignGenerateKeyInputs;
	sign?: AuthenticationExtensionsSignSignInputs;
}

export interface AuthenticationExtensionsSignGenerateKeyInputs {
	algorithms: COSEAlgorithmIdentifier[];
	tbs?: BufferSource;
}

export interface AuthenticationExtensionsSignSignInputs {
	tbs: BufferSource;
	keyHandleByCredential: { [credentialId: string]: COSEKeyRef };
}

export type COSEKeyRef = BufferSource;

export interface AuthenticationExtensionsSignOutputs {
	generatedKey?: AuthenticationExtensionsSignGeneratedKey;
	signature?: ArrayBuffer;
};

export interface AuthenticationExtensionsSignGeneratedKey {
	publicKey: ArrayBuffer;
	keyHandle: ArrayBuffer;
};

declare global {
	export interface AuthenticationExtensionsClientInputs {
		sign?: AuthenticationExtensionsSignInputs;
	}

	export interface AuthenticationExtensionsClientOutputs {
		sign?: AuthenticationExtensionsSignOutputs;
	}
}


export type WebauthnSignKeypair = { arkg: WebauthnSignArkgPublicSeed };
export type WebauthnSignArkgPublicSeed = {
	credentialId: Uint8Array,
	publicSeed: ParsedCOSEKeyArkgPubSeed,
}

export type KeyReference = {
	credentialId: Uint8Array,
	keyRef: Uint8Array,
}


export function parseGeneratedKey(credential: PublicKeyCredential | null)
	: WebauthnSignKeypair | null {
	const generatedKey = credential?.getClientExtensionResults()?.sign?.generatedKey;
	if (generatedKey) {
		try {
			const key = parseCoseKey(cbor.decodeFirstSync(generatedKey.publicKey));
			const credentialId = new Uint8Array(credential.rawId);
			switch (key.kty) {
				case COSE_KTY_ARKG_PUB:
					return {
						arkg: {
							credentialId,
							publicSeed: key,
						},
					};

				default:
					// @ts-ignore
					console.log(`Unsupported COSE key type: ${key.kty}`);
					return null;
			}
		} catch (e) {
			console.error("Failed to parse sign extension generated key", e);
			return null;
		}
	} else {
		return null;
	}
}

export function parseSignature(credential: PublicKeyCredential): Uint8Array | null {
	const authData = parseAuthenticatorData(new Uint8Array((credential.response as AuthenticatorAssertionResponse).authenticatorData));
	const sig = authData?.extensions?.sign?.get(6);
	return sig ?? null;
}

export async function generateArkgKeypair(seed: WebauthnSignArkgPublicSeed): Promise<{ publicKey: CryptoKey, privateKey: KeyReference }> {
	return deriveArkgKeypair(seed, crypto.getRandomValues(new Uint8Array(32)), new TextEncoder().encode('wwwallet credential'));
}

export async function deriveArkgKeypair(
	seed: WebauthnSignArkgPublicSeed,
	ikm: BufferSource,
	ctx: Uint8Array,
): Promise<{ publicKey: CryptoKey, privateKey: KeyReference }> {
	const arkgInstance = arkg.getCoseEcInstance(seed.publicSeed.alg);
	const [pkPoint, arkgKeyHandle] = await arkgInstance.derivePublicKey(
		await arkg.ecPublicKeyFromCose(seed.publicSeed),
		ikm,
		ctx,
	);
	const publicKey = await ec.publicKeyFromPoint("ECDSA", "P-256", pkPoint);
	const privateKey: KeyReference = {
		credentialId: seed.credentialId,
		keyRef: new Uint8Array(encodeCoseKeyRefArkgDerived({
			kty: COSE_KTY_ARKG_DERIVED,
			kid: seed.publicSeed.kid,
			alg: COSE_ALG_ESP256_ARKG,
			kh: new Uint8Array(arkgKeyHandle),
			info: ctx,
		})),
	};
	return { publicKey, privateKey };
}

export function makeGenerateKeyInputs(...algorithms: COSEAlgorithmIdentifier[]): AuthenticationExtensionsClientInputs {
	return {
		sign: {
			generateKey: {
				algorithms,
			},
		},
	};
}

export async function makeSignInputs(
	key: KeyReference,
	data: BufferSource,
): Promise<AuthenticationExtensionsClientInputs> {
	const prehashAlgs = [COSE_ALG_ESP256_ARKG];
	const parsedKeyRef = cbor.decode(key.keyRef);
	const shouldPrehash = prehashAlgs.includes(parsedKeyRef.get(3));
	return {
		sign: {
			sign: {
				keyHandleByCredential: {
					[toBase64Url(key.credentialId)]: key.keyRef,
				},
				tbs: shouldPrehash ? await crypto.subtle.digest("SHA-256", data) : data,
			},
		},
	};
}
