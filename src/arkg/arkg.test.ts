import { assert, describe, it } from "vitest";

import { EcInstanceId, getEcInstance } from '.';
import * as ec from './ec';
import { byteArrayEquals, concat, toBase64, toHex } from '../util';
import { asyncAssertThrows } from '../testutil';


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
