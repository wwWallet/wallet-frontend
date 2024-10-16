/// Implementation of ARKG
/// https://yubico.github.io/arkg-rfc/draft-bradleylundberg-cfrg-arkg.html

import * as ec from './ec';
import * as hash_to_curve from './hash_to_curve';
import { byteArrayEquals, concat, fromBase64Url, OS2IP, toBase64, toHex, toU8 } from '../util';


type GenerateKeypairFunction<PublicKey, PrivateKey> = (
	() => Promise<[PublicKey, PrivateKey]>
);

type KemEncapsFunction<PublicKey> = (
	(pubk: PublicKey, info: BufferSource) => Promise<[ArrayBuffer, ArrayBuffer]>
);
type KemDecapsFunction<PrivateKey> = (
	(prik: PrivateKey, c: BufferSource, info: BufferSource) => Promise<ArrayBuffer>
);
type KemScheme<PublicKey, PrivateKey> = {
	generateKeypair: GenerateKeypairFunction<PublicKey, PrivateKey>,
	encaps: KemEncapsFunction<PublicKey>,
	decaps: KemDecapsFunction<PrivateKey>,
}

type BlBlindKeyFunction<BaseKey, BlindedKey> = (
	(key: BaseKey, tau: BufferSource, info: BufferSource) => Promise<BlindedKey>
);
type BlScheme<PublicKey, PrivateKey, DerivedPublicKey, DerivedPrivateKey> = {
	generateKeypair: GenerateKeypairFunction<PublicKey, PrivateKey>,
	blindPublicKey: BlBlindKeyFunction<PublicKey, DerivedPublicKey>,
	blindPrivateKey: BlBlindKeyFunction<PrivateKey, DerivedPrivateKey>,
}

type ArkgPublicSeed<BlPublicKey, KemPublicKey> = {
	pubk_bl: BlPublicKey,
	pubk_kem: KemPublicKey,
}
type ArkgPrivateSeed<BlPublicKey, KemPublicKey> = {
	prik_bl: BlPublicKey,
	prik_kem: KemPublicKey,
}

type ArkgGenerateSeedFunction<BlPublicKey, BlPrivateKey, KemPublicKey, KemPrivateKey> = (
	GenerateKeypairFunction<ArkgPublicSeed<BlPublicKey, KemPublicKey>, ArkgPrivateSeed<BlPrivateKey, KemPrivateKey>>
);
type ArkgDerivePublicKeyFunction<BlPublicKey, KemPublicKey, DerivedPublicKey> = (
	(
		seed_pk: ArkgPublicSeed<BlPublicKey, KemPublicKey>,
		info: BufferSource,
	) => Promise<[DerivedPublicKey, ArrayBuffer]>
);
type ArkgDerivePrivateKeyFunction<BlPrivateKey, KemPrivateKey, DerivedPrivateKey> = (
	(
		seed_prik: ArkgPrivateSeed<BlPrivateKey, KemPrivateKey>,
		kh: BufferSource,
		info: BufferSource,
	) => Promise<DerivedPrivateKey>
);
type ArkgInstance<BlPublicKey, BlPrivateKey, KemPublicKey, KemPrivateKey, DerivedPublicKey, DerivedPrivateKey> = {
	/** @see https://yubico.github.io/arkg-rfc/draft-bradleylundberg-cfrg-arkg.html#name-the-function-arkg-generate- */
	generateSeed: ArkgGenerateSeedFunction<BlPublicKey, BlPrivateKey, KemPublicKey, KemPrivateKey>,

	/** @see https://yubico.github.io/arkg-rfc/draft-bradleylundberg-cfrg-arkg.html#name-the-function-arkg-derive-pu */
	derivePublicKey: ArkgDerivePublicKeyFunction<BlPublicKey, KemPublicKey, DerivedPublicKey>,

	/** @see https://yubico.github.io/arkg-rfc/draft-bradleylundberg-cfrg-arkg.html#name-the-function-arkg-derive-pr */
	derivePrivateKey: ArkgDerivePrivateKeyFunction<BlPrivateKey, KemPrivateKey, DerivedPrivateKey>,
}


/** @see https://yubico.github.io/arkg-rfc/draft-bradleylundberg-cfrg-arkg.html#name-the-asynchronous-remote-key */
function arkg<BlPublicKey, BlPrivateKey, KemPublicKey, KemPrivateKey, DerivedPublicKey, DerivedPrivateKey>(
	bl: BlScheme<BlPublicKey, BlPrivateKey, DerivedPublicKey, DerivedPrivateKey>,
	kem: KemScheme<KemPublicKey, KemPrivateKey>,
): ArkgInstance<BlPublicKey, BlPrivateKey, KemPublicKey, KemPrivateKey, DerivedPublicKey, DerivedPrivateKey> {
	return {
		generateSeed: async (): Promise<[ArkgPublicSeed<BlPublicKey, KemPublicKey>, ArkgPrivateSeed<BlPrivateKey, KemPrivateKey>]> => {
			const [pubk_bl, prik_bl] = await bl.generateKeypair();
			const [pubk_kem, prik_kem] = await kem.generateKeypair();
			const pubk = { pubk_bl, pubk_kem };
			const prik = { prik_bl, prik_kem };
			return [pubk, prik];
		},

		derivePublicKey: async (
			{ pubk_bl, pubk_kem }: ArkgPublicSeed<BlPublicKey, KemPublicKey>,
			info: BufferSource,
		): Promise<[DerivedPublicKey, ArrayBuffer]> => {
			const info_kem = concat(new TextEncoder().encode('ARKG-Derive-Key-KEM.'), info);
			const info_bl = concat(new TextEncoder().encode('ARKG-Derive-Key-BL.'), info);
			const [tau, c] = await kem.encaps(pubk_kem, info_kem);
			const pk_prime = await bl.blindPublicKey(pubk_bl, tau, info_bl);
			const kh = c;
			return [pk_prime, kh];
		},

		derivePrivateKey: async (
			{ prik_bl, prik_kem }: ArkgPrivateSeed<BlPrivateKey, KemPrivateKey>,
			kh: BufferSource,
			info: BufferSource,
		): Promise<DerivedPrivateKey> => {
			const info_kem = concat(new TextEncoder().encode('ARKG-Derive-Key-KEM.'), info);
			const info_bl = concat(new TextEncoder().encode('ARKG-Derive-Key-BL.'), info);
			const tau = await kem.decaps(prik_kem, kh, info_kem);
			const sk_prime = await bl.blindPrivateKey(prik_bl, tau, info_bl);
			return sk_prime;
		}
	};
}

/** @see https://yubico.github.io/arkg-rfc/draft-bradleylundberg-cfrg-arkg.html#name-using-elliptic-curve-additi */
function arkgBlEcAdd(
	hashToCurveSuiteId: hash_to_curve.SuiteId,
	dst_ext: BufferSource,
): BlScheme<ec.Point, bigint, ec.Point, bigint> {
	const { suiteParams } = hash_to_curve.hashToCurve(hashToCurveSuiteId, concat(
		new TextEncoder().encode('ARKG-BL-EC.'),
		dst_ext,
	));
	const { curve: crv } = suiteParams;

	if (suiteParams.m !== 1) {
		throw new Error("Invalid argument: hash_to_crv_suite parameter m must equal 1");
	}

	return {
		generateKeypair: async (): Promise<[ec.Point, bigint]> => {
			const { publicKey, privateKey } = await crypto.subtle.generateKey(
				{ name: "ECDSA", namedCurve: suiteParams.curve.webCryptoName },
				true,
				["sign"],
			);
			const jwk = await crypto.subtle.exportKey("jwk", privateKey);
			return [
				await ec.pointFromPublicKey(crv, publicKey),
				OS2IP(fromBase64Url(jwk.d)),
			];
		},

		blindPublicKey: async (pk: ec.Point, tau: BufferSource, info: BufferSource): Promise<ec.Point> => {
			const DST = concat(new TextEncoder().encode('ARKG-BL-EC.'), dst_ext, info);
			const { hashToScalarField } = hash_to_curve.hashToCurve(hashToCurveSuiteId, DST);
			const [[tau_prime]] = await hashToScalarField(tau, 1);
			const pk_tau = ec.vartimeAdd(crv, pk, ec.vartimeMul(crv, crv.generator, tau_prime));
			return pk_tau;
		},

		blindPrivateKey: async (prik: bigint, tau: BufferSource, info: BufferSource): Promise<bigint> => {
			const DST = concat(new TextEncoder().encode('ARKG-BL-EC.'), dst_ext, info);
			const { hashToScalarField } = hash_to_curve.hashToCurve(hashToCurveSuiteId, DST);
			const [[tau_prime]] = await hashToScalarField(tau, 1);
			const sk_tau_tmp = (prik + tau_prime) % crv.order;
			if (sk_tau_tmp === 0n) {
				throw new Error("Invalid secret key");
			}
			const sk_tau = sk_tau_tmp;
			return sk_tau;
		},
	};
}

/** @see https://yubico.github.io/arkg-rfc/draft-bradleylundberg-cfrg-arkg.html#name-using-hmac-to-adapt-a-kem-w */
function arkgHmacKem<PublicKey, PrivateKey>(
	hash: "SHA-256",
	dst_ext: BufferSource,
	SubKem: KemScheme<PublicKey, PrivateKey>,
): KemScheme<PublicKey, PrivateKey> {
	return {
		generateKeypair: SubKem.generateKeypair,

		encaps: async (pubk: PublicKey, info: BufferSource): Promise<[ArrayBuffer, ArrayBuffer]> => {
			const info_sub = concat(new TextEncoder().encode('ARKG-KEM-HMAC.'), dst_ext, info);
			const [k_prime, c_prime] = await SubKem.encaps(pubk, info_sub);

			const ikm = await crypto.subtle.importKey("raw", k_prime, { name: "HKDF" }, false, ["deriveBits", "deriveKey"]);

			const mk = await crypto.subtle.deriveKey(
				{
					name: "HKDF",
					hash,
					salt: new Uint8Array([]),
					info: concat(new TextEncoder().encode('ARKG-KEM-HMAC-mac.'), dst_ext, info),
				},
				ikm,
				{ name: "HMAC", hash },
				false,
				["sign"],
			);
			const t = toU8(await crypto.subtle.sign("HMAC", mk, c_prime)).slice(0, 16);

			const k = await crypto.subtle.deriveBits(
				{
					name: "HKDF",
					hash,
					salt: new Uint8Array([]),
					info: concat(new TextEncoder().encode('ARKG-KEM-HMAC-shared.'), dst_ext, info),
				},
				ikm,
				k_prime.byteLength,
			);
			const c = concat(t, c_prime);

			return [k, c];
		},

		decaps: async (prik: PrivateKey, c: BufferSource, info: BufferSource): Promise<ArrayBuffer> => {
			const c_u8 = toU8(c);
			const t = c_u8.slice(0, 16);
			const c_prime = c_u8.slice(16);
			const info_sub = concat(new TextEncoder().encode('ARKG-KEM-HMAC.'), dst_ext, info);
			const k_prime = await SubKem.decaps(prik, c_prime, info_sub);

			const ikm = await crypto.subtle.importKey("raw", k_prime, { name: "HKDF" }, false, ["deriveBits", "deriveKey"]);

			const mk = await crypto.subtle.deriveKey(
				{
					name: "HKDF",
					hash,
					salt: new Uint8Array([]),
					info: concat(new TextEncoder().encode('ARKG-KEM-HMAC-mac.'), dst_ext, info),
				},
				ikm,
				{ name: "HMAC", hash },
				false,
				["sign"],
			);

			const t_prime = new Uint8Array(await crypto.subtle.sign("HMAC", mk, c_prime)).slice(0, 16);
			if (byteArrayEquals(t, t_prime)) {
				const k = await crypto.subtle.deriveBits(
					{
						name: "HKDF",
						hash,
						salt: new Uint8Array([]),
						info: concat(new TextEncoder().encode('ARKG-KEM-HMAC-shared.'), dst_ext, info),
					},
					ikm,
					k_prime.byteLength,
				);
				return k;

			} else {
				throw new Error("Invalid MAC");
			}
		},
	};
}

/** @see https://yubico.github.io/arkg-rfc/draft-bradleylundberg-cfrg-arkg.html#name-using-ecdh-as-the-kem */
function arkgEcdhKem(
	namedCurve: "P-256",
	hash: "SHA-256",
	dst_ext: BufferSource,
): KemScheme<CryptoKey, CryptoKey> {
	const [crv, L]: [ec.Curve, number] = (namedCurve === "P-256" ? [ec.curveSecp256r1(), 8 * 32] : [null, null]);
	if (crv === null) {
		throw new Error("Unknown curve: " + namedCurve);
	}

	const generateKeypair = async (): Promise<[CryptoKey, CryptoKey]> => {
		const { publicKey, privateKey } = await crypto.subtle.generateKey(
			{ name: "ECDH", namedCurve },
			true,
			["deriveBits"],
		);
		return [publicKey, privateKey];
	};

	return arkgHmacKem(hash, dst_ext, {
		generateKeypair,

		encaps: async (pubk: CryptoKey, _info: BufferSource): Promise<[ArrayBuffer, ArrayBuffer]> => {
			const [pk_prime, sk_prime] = await generateKeypair();
			const k = await crypto.subtle.deriveBits({ name: "ECDH", public: pubk }, sk_prime, L);
			const c = await crypto.subtle.exportKey("raw", pk_prime);
			return [k, c];
		},

		decaps: async (prik: CryptoKey, c: BufferSource, _info: BufferSource): Promise<ArrayBuffer> => {
			const pk_prime = await crypto.subtle.importKey("raw", c, { name: "ECDH", namedCurve }, true, []);
			const k = await crypto.subtle.deriveBits({ name: "ECDH", public: pk_prime }, prik, L);
			return k;
		},
	});
}

/**
	@see https://yubico.github.io/arkg-rfc/draft-bradleylundberg-cfrg-arkg.html#name-arkg-p256add-ecdh
	*/
export type EcInstanceId = (
	'ARKG-P256ADD-ECDH'
);

// Declare as factory functions instead of a global variable registry to prevent callers from overriding internal properties
const ecInstances: { [id in EcInstanceId]: () => ArkgInstance<ec.Point, bigint, CryptoKey, CryptoKey, ec.Point, bigint> } = {
	'ARKG-P256ADD-ECDH': () => arkg(
		arkgBlEcAdd("P256_XMD:SHA-256_SSWU_RO_", new TextEncoder().encode('ARKG-P256ADD-ECDH')),
		arkgEcdhKem("P-256", "SHA-256", new TextEncoder().encode('ARKG-P256ADD-ECDH')),
	),
};

/**
	Instantiate an EC-based ARKG instance.

	@see https://yubico.github.io/arkg-rfc/draft-bradleylundberg-cfrg-arkg.html#name-concrete-arkg-instantiation
	*/
export function getEcInstance(id: EcInstanceId): ArkgInstance<ec.Point, bigint, CryptoKey, CryptoKey, ec.Point, bigint> {
	return ecInstances[id]();
}


import { assert, describe, it } from "vitest";
import { asyncAssertThrows } from '../testutil';

export function tests() {

	describe("Assumptions:", async () => {
		it("In WebCrypto, empty HKDF salt is equivalent to no salt (interpreted as hashLen zeros)", async () => {
			const key0 = await crypto.subtle.generateKey({ name: "HMAC", hash: "SHA-256" }, true, ["sign"]);
			const keyx = await crypto.subtle.exportKey("raw", key0);
			const key = await crypto.subtle.importKey("raw", keyx, "HKDF", false, ["deriveBits"]);
			const zeroes32 = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
			assert.equal(zeroes32.length, 32);
			const okm1 = await crypto.subtle.deriveBits(
				{
					name: "HKDF",
					hash: "SHA-256",
					salt: new Uint8Array([]),
					info: new TextEncoder().encode("assumption test"),
				},
				key,
				64 * 8,
			);
			const okm2 = await crypto.subtle.deriveBits(
				{
					name: "HKDF",
					hash: "SHA-256",
					salt: zeroes32,
					info: new TextEncoder().encode("assumption test"),
				},
				key,
				64 * 8,
			);
			assert.isTrue(byteArrayEquals(okm1, okm2));
		});
	});

	describe("ARKG", async () => {
		const instances: {
			instanceName: EcInstanceId,
			namedCurve: "P-256",
			signAlgorithm: EcdsaParams,
		}[] = [
				{
					instanceName: "ARKG-P256ADD-ECDH",
					namedCurve: "P-256",
					signAlgorithm: { name: "ECDSA", hash: "SHA-256" },
				},
			];
		for (const { instanceName, namedCurve, signAlgorithm } of instances) {
			const arkgInstance = getEcInstance(instanceName);

			describe(`instance ${instanceName}`, async () => {
				it("is correct.", async () => {
					const [pub_seed, pri_seed] = await arkgInstance.generateSeed();
					const info = new TextEncoder().encode(instanceName + "test vectors");
					const [derived_pubk, kh] = await arkgInstance.derivePublicKey(pub_seed, info);
					const derived_prik = await arkgInstance.derivePrivateKey(pri_seed, kh, info);
					const publicKey = await ec.publicKeyFromPoint(signAlgorithm.name, namedCurve, derived_pubk);
					const privateKey = await ec.privateKeyFromScalar(signAlgorithm.name, namedCurve, derived_prik, false, ["sign"]);
					const sig = await crypto.subtle.sign(signAlgorithm, privateKey, info);
					const valid = await crypto.subtle.verify(signAlgorithm, publicKey, sig, concat(info));
					assert.isTrue(valid, "Invalid signature");
				});

				describe("generateSeed", () => {
					it("generates different results on repeat calls.", async () => {
						const [pub_seed_1, pri_seed_1] = await arkgInstance.generateSeed();
						const [pub_seed_2, pri_seed_2] = await arkgInstance.generateSeed();
						assert.notDeepEqual(pub_seed_1, pub_seed_2);
						assert.notEqual(pri_seed_1, pri_seed_2);
					});
				});

				describe("derivePublicKey", () => {
					it("generates different results on repeat calls.", async () => {
						const [pub_seed,] = await arkgInstance.generateSeed();
						const info = new TextEncoder().encode(instanceName + "test vectors");
						const [derived_pubk_1, kh_1] = await arkgInstance.derivePublicKey(pub_seed, info);
						const [derived_pubk_2, kh_2] = await arkgInstance.derivePublicKey(pub_seed, info);
						assert.notDeepEqual(derived_pubk_1, derived_pubk_2);
						assert.notDeepEqual(toBase64(kh_1), toBase64(kh_2));
					});
				});

				describe("derivePrivateKey", () => {
					it("generates the same result on repeat calls.", async () => {
						const [pub_seed, pri_seed] = await arkgInstance.generateSeed();
						const info = new TextEncoder().encode(instanceName + "test vectors");
						const [, kh] = await arkgInstance.derivePublicKey(pub_seed, info);
						const derived_prik_1 = await arkgInstance.derivePrivateKey(pri_seed, kh, info);
						const derived_prik_2 = await arkgInstance.derivePrivateKey(pri_seed, kh, info);
						assert.equal(derived_prik_1, derived_prik_2);
					});

					it("fails if any bit of the key handle is modified.", async () => {
						const [pub_seed, pri_seed] = await arkgInstance.generateSeed();
						const info = new TextEncoder().encode(instanceName + "test vectors");
						const [, kh] = await arkgInstance.derivePublicKey(pub_seed, info);
						const kh_u8 = new Uint8Array(kh);
						for (let i = 0; i < kh.byteLength * 8; ++i) {
							const kh_mod = new Uint8Array([...kh_u8]);
							const byte_i = Math.floor(i / 8);
							const bit_i = i % 8;
							kh_mod[byte_i] = kh_mod[byte_i] ^ (0x01 << bit_i);
							await asyncAssertThrows(
								async () => await arkgInstance.derivePrivateKey(pri_seed, kh_mod, info),
								`Expected key handle modified at bit index ${bit_i} of byte index ${byte_i} to fail. Unmodified: ${toHex(kh)}; modified: ${toHex(kh_mod)}`,
							);
						}
					});

					it("derives the wrong private key if any bit of the key handle is modified.", async () => {
						const [pub_seed, pri_seed] = await arkgInstance.generateSeed();
						const info = new TextEncoder().encode(instanceName + "test vectors");
						const [derived_pubk, kh] = await arkgInstance.derivePublicKey(pub_seed, info);
						const kh_u8 = new Uint8Array(kh);
						for (let i = 0; i < kh.byteLength * 8; ++i) {
							const kh_mod = new Uint8Array([...kh_u8]);
							const byte_i = Math.floor(i / 8);
							const bit_i = i % 8;
							kh_mod[byte_i] = kh_mod[byte_i] ^ (0x01 << bit_i);
							await asyncAssertThrows(
								async () => {
									const derived_prik = await arkgInstance.derivePrivateKey(pri_seed, kh_mod, info)
									const publicKey = await ec.publicKeyFromPoint(signAlgorithm.name, namedCurve, derived_pubk);
									const privateKey = await ec.privateKeyFromScalar(signAlgorithm.name, namedCurve, derived_prik, false, ["sign"]);
									const sig = await crypto.subtle.sign(signAlgorithm, privateKey, info);
									const valid = await crypto.subtle.verify(signAlgorithm, publicKey, sig, concat(info));
									assert.isFalse(valid, "Unexpected valid signature");
								},
								`Expected key handle modified at bit index ${bit_i} of byte index ${byte_i} to result in the wrong private key. Unmodified: ${toHex(kh)}; modified: ${toHex(kh_mod)}`,
							);
						}
					}, { timeout: 60000 });
				});
			});
		}
	});
}
