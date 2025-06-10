import { assert, describe, it } from "vitest";

import { EcInstanceId, getEcInstance } from '.';
import * as ec from './ec';
import { byteArrayEquals, concat, fromHex, toBase64, toHex } from '../util';
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

				describe("passes test vectors:", async () => {
					async function runTestVector(
						info: string,
						skBlHex: string,
						skKemHex: string,
						khHex: string,
						expectDerivedSkHex: string,
					) {
						it(info, async () => {
							const infoBytes = new TextEncoder().encode(info);
							const sk = {
								prik_bl: BigInt("0x" + skBlHex),
								prik_kem: await ec.privateKeyFromScalar("ECDH", "P-256", BigInt("0x" + skKemHex), false, ["deriveBits"]),
							};
							const kh = fromHex(khHex);

							const arkgInstance = getEcInstance('ARKG-P256ADD-ECDH');
							const derivedPrivateKey = await arkgInstance.derivePrivateKey(sk, kh, infoBytes);

							assert.equal(
								derivedPrivateKey,
								BigInt("0x" + expectDerivedSkHex),
							);
						});
					}

					await runTestVector(
						"ARKG-P256ADD-ECDH.test vectors",
						"a23d8fee87b11ebf9e15b306125bfbaec4cfb8f7ceb9fac21d6418e08de2fffa",
						"8da3fbb332338675bf510f271c3849e5acdc8ff3c70896431b7ff867b687fa61",
						"26729571445735ce3ef812c34d8fa4b4041de87c951ce50d774877aa126d51ef770adc85f65cb3735d437110a4b1ffe0c9a6b93dc98b395e61a9a30f4eb46dd2358beec7a7b6ee47f7357994c11d96ae71",
						"75c04746a8234749152131fa778b909bb0bbd0542f25d311643361dce9fdccdc",
					);
					await runTestVector(
						"ARKG-P256ADD-ECDH.test vectors.0",
						"944d2b4d5cadad3a7eccdb83c8f5755403d94d782c600ec414d2f339c4568bd4",
						"8118182368db06e9861cf421f26d579efcdd68448d502c0282a4b657a350d988",
						"08f3f65abe207116aca477b5655e076a04f33b68d15e544c707eeb7e3361af94f80d305adf339dc79e9032a3f695a793decbfc3174c254698358bb82b66f2787809c7d705526332c70f111662adbac7a44",
						"cc9fd36b23d2fae3f340ce208946ed8a009b761886105199b453dabe353da6fb",
					);
					await runTestVector(
						"ARKG-P256ADD-ECDH.test vectors.1",
						"91f31cdeddfc29c6cf57e03f49cf3c66624ad14026062868339a8aab59be5620",
						"49b10d5bf91c04255c8007e0fa30d3b815dd50be0c42532cabd5b4010db1c551",
						"95ecfb538565f77383de363a7884dcfd04e1079a5bc34ea830a96e18db1987d58f56e831894daddeb1e7e8803a1070eedaf80acc138fac948dacb7315d8c1aebe71897e35173cafba15c939f95aae53550",
						"b8b9da66d862a7aa411e466d1fbe5b134c09f24cfc6b3b017a50bf8ffabf98c6",
					);
				});
			});
		});
	}
});
