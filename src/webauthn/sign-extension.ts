/// Sign extension v4: https://yubicolabs.github.io/webauthn-sign-extension/4/#sctn-sign-extension

import * as cbor from 'cbor-web';
import { COSE_ALG_ESP256_ARKG, COSE_KTY_ARKG_PUB, encodeArkgSignArgs, parseCoseKey } from 'wallet-common/dist/cose';
import * as arkg from "wallet-common/dist/arkg";
import * as ec from "wallet-common/dist/arkg/ec";

import { toBase64Url } from '@/util';
import { CurrentSchema, SchemaV5 } from '@/services/WalletStateSchema';
import { parseAuthenticatorData } from '@/webauthn';

type WebauthnSignPrivateKeyArkg = CurrentSchema.WebauthnSignPrivateKeyArkg;


export interface AuthenticationExtensionsSignInputs {
	generateKey?: AuthenticationExtensionsSignGenerateKeyInputs;
	signByCredential?: Record<string, AuthenticationExtensionsSignSignInputs>;
}

export interface AuthenticationExtensionsSignGenerateKeyInputs {
	algorithms: COSEAlgorithmIdentifier[];
}

export interface AuthenticationExtensionsSignSignInputs {
	keyHandle: BufferSource;
	tbs: BufferSource;
	additionalArgs?: COSESignArgs;
}

export type COSESignArgs = BufferSource;

export interface AuthenticationExtensionsSignOutputs {
	generatedKey?: AuthenticationExtensionsSignGeneratedKey;
	signature?: ArrayBuffer;
};

export interface AuthenticationExtensionsSignGeneratedKey {
	keyHandle: ArrayBuffer;
	publicKey: ArrayBuffer;
	algorithm: COSEAlgorithmIdentifier;
	attestationObject: ArrayBuffer;
};

declare global {
	export interface AuthenticationExtensionsClientInputs {
		previewSign?: AuthenticationExtensionsSignInputs;
	}

	export interface AuthenticationExtensionsClientOutputs {
		previewSign?: AuthenticationExtensionsSignOutputs;
	}
}


export type WebauthnSignKeypair = { arkg: WebauthnSignArkgPublicSeed };
export type WebauthnSignArkgPublicSeed = SchemaV5.WebauthnSignArkgPublicSeed;


export function parseGeneratedKey(credential: PublicKeyCredential | null)
	: WebauthnSignKeypair | null {
	const generatedKey = credential?.getClientExtensionResults()?.previewSign?.generatedKey;
	if (generatedKey) {
		try {
			const key = parseCoseKey(cbor.decodeFirstSync(generatedKey.publicKey));
			const keyHandle = new Uint8Array(generatedKey.keyHandle);
			const credentialId = new Uint8Array(credential.rawId);
			switch (key.kty) {
				case COSE_KTY_ARKG_PUB:
					return {
						arkg: {
							credentialId,
							publicSeed: key,
							keyHandle,
							derivedKeyAlgorithm: generatedKey.algorithm,
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
	const sig = authData?.extensions?.previewSign?.get(6);
	return sig ?? null;
}

export async function generateArkgKeypair(seed: WebauthnSignArkgPublicSeed): Promise<{ publicKey: CryptoKey, privateKey: WebauthnSignPrivateKeyArkg }> {
	return deriveArkgKeypair(seed, crypto.getRandomValues(new Uint8Array(32)), new TextEncoder().encode('wwwallet credential'));
}

export async function deriveArkgKeypair(
	seed: WebauthnSignArkgPublicSeed,
	ikm: BufferSource,
	ctx: Uint8Array,
): Promise<{ publicKey: CryptoKey, privateKey: WebauthnSignPrivateKeyArkg }> {
	const arkgInstance = arkg.getCoseEcInstance(seed.publicSeed.alg);
	const [pkPoint, arkgKeyHandle] = await arkgInstance.derivePublicKey(
		await arkg.ecPublicKeyFromCose(seed.publicSeed),
		ikm,
		ctx,
	);
	const publicKey = await ec.publicKeyFromPoint("ECDSA", "P-256", pkPoint);
	const privateKey: WebauthnSignPrivateKeyArkg = {
		credentialId: seed.credentialId,
		keyHandle: seed.keyHandle,
		algorithm: seed.derivedKeyAlgorithm,
		additionalArgs: {
			kh: new Uint8Array(arkgKeyHandle),
			ctx,
		},
	};
	return { publicKey, privateKey };
}

export function makeGenerateKeyInputs(...algorithms: COSEAlgorithmIdentifier[]): AuthenticationExtensionsClientInputs {
	return {
		previewSign: {
			generateKey: {
				algorithms,
			},
		},
	};
}

export async function makeSignInputs(
	key: SchemaV5.WebauthnSignPrivateKey,
	data: BufferSource,
	additionalArgs?: COSESignArgs,
): Promise<AuthenticationExtensionsClientInputs> {
	const prehashAlgs = [COSE_ALG_ESP256_ARKG];
	const shouldPrehash = prehashAlgs.includes(key.algorithm);
	return {
		previewSign: {
			signByCredential: {
				[toBase64Url(key.credentialId)]: {
					keyHandle: key.keyHandle,
					tbs: shouldPrehash ? await crypto.subtle.digest("SHA-256", data) : data,
					...(additionalArgs
						? { additionalArgs }
						: (key.additionalArgs
							? { additionalArgs: encodeArkgSignArgs(key.algorithm, key.additionalArgs) }
							: {}
						)),
				},
			},
		},
	};
}
