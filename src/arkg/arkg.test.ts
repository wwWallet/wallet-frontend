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
		crv: ec.Curve,
	}[] = [
			{
				instanceName: "ARKG-P256",
				namedCurve: "P-256",
				signAlgorithm: { name: "ECDSA", hash: "SHA-256" },
				crv: ec.curveSecp256r1(),
			},
		];
	for (const { instanceName, namedCurve, signAlgorithm, crv } of instances) {
		const arkgInstance = getEcInstance(instanceName);

		describe(`instance ${instanceName}`, async () => {

			const ikm_bl = crypto.getRandomValues(new Uint8Array(32));
			const ikm_kem = crypto.getRandomValues(new Uint8Array(32));
			const ikm = crypto.getRandomValues(new Uint8Array(32));

			const ikm_bl_1 = ikm_bl;
			const ikm_bl_2 = crypto.getRandomValues(new Uint8Array(32));
			const ikm_kem_1 = ikm_kem;
			const ikm_kem_2 = crypto.getRandomValues(new Uint8Array(32));
			const ikm_1 = ikm;
			const ikm_2 = crypto.getRandomValues(new Uint8Array(32));

			const [pub_seed, pri_seed] = await arkgInstance.deriveSeed(ikm_bl, ikm_kem);

			const ctx = new TextEncoder().encode(instanceName + "test vectors");
			const [derived_pubk, kh] = await arkgInstance.derivePublicKey(pub_seed, ikm, ctx);

			it("forbids ctx values longer than 64 bytes.", async () => {
				const ctx = crypto.getRandomValues(new Uint8Array(65));
				const [derived_pubk, kh] = await arkgInstance.derivePublicKey(pub_seed, ikm, ctx.slice(0, 64));
				assert.deepEqual(
					(await asyncAssertThrows(
						async () => await arkgInstance.derivePublicKey(pub_seed, ikm, ctx),
						"Expected derivePublicKey to fail with ctx longer than 64 bytes",
					) as any).cause,
					{ ctx, maxLength: 64 },
				);

				const derived_prik = await arkgInstance.derivePrivateKey(pri_seed, kh, ctx.slice(0, 64));
				assert.deepEqual(
					(await asyncAssertThrows(
						async () => await arkgInstance.derivePrivateKey(pri_seed, kh, ctx),
						"Expected derivePublicKey to fail with ctx longer than 64 bytes",
					) as any).cause,
					{ ctx, maxLength: 64 },
				);

				const publicKey = await ec.publicKeyFromPoint(signAlgorithm.name, namedCurve, derived_pubk);
				const privateKey = await ec.privateKeyFromScalar(signAlgorithm.name, namedCurve, derived_prik, false, ["sign"]);
				const sig = await crypto.subtle.sign(signAlgorithm, privateKey, ctx);
				const valid = await crypto.subtle.verify(signAlgorithm, publicKey, sig, concat(ctx));
				assert.isTrue(valid, "Invalid signature");
			});

			it("is correct.", async () => {
				const derived_prik = await arkgInstance.derivePrivateKey(pri_seed, kh, ctx);
				const publicKey = await ec.publicKeyFromPoint(signAlgorithm.name, namedCurve, derived_pubk);
				const privateKey = await ec.privateKeyFromScalar(signAlgorithm.name, namedCurve, derived_prik, false, ["sign"]);
				const sig = await crypto.subtle.sign(signAlgorithm, privateKey, ctx);
				const valid = await crypto.subtle.verify(signAlgorithm, publicKey, sig, concat(ctx));
				assert.isTrue(valid, "Invalid signature");
			});

			describe("deriveSeed", () => {
				it("derives the same results on repeat calls.", async () => {
					const [pub_seed_1, pri_seed_1] = [pub_seed, pri_seed];
					const [pub_seed_2, pri_seed_2] = await arkgInstance.deriveSeed(ikm_bl, ikm_kem);
					assert.deepEqual(pub_seed_1, pub_seed_2);
					assert.deepEqual(pri_seed_1, pri_seed_2);
				});

				it("derives different results on calls with different ikm.", async () => {
					const [pub_seed_1, pri_seed_1] = [pub_seed, pri_seed];
					const [pub_seed_2, pri_seed_2] = await arkgInstance.deriveSeed(ikm_bl_2, ikm_kem_2);
					assert.notDeepEqual(pub_seed_1, pub_seed_2);
					assert.notDeepEqual(pri_seed_1, pri_seed_2);
				});
			});

			describe("derivePublicKey", () => {
				it("derives the same results on repeat calls.", async () => {
					const [derived_pubk_1, kh_1] = await arkgInstance.derivePublicKey(pub_seed, ikm, ctx);
					const [derived_pubk_2, kh_2] = await arkgInstance.derivePublicKey(pub_seed, ikm, ctx);
					assert.deepEqual(derived_pubk_1, derived_pubk_2);
					assert.deepEqual(toBase64(kh_1), toBase64(kh_2));
				});

				it("derives different results on calls with different ikm.", async () => {
					const [derived_pubk_1, kh_1] = await arkgInstance.derivePublicKey(pub_seed, ikm_1, ctx);
					const [derived_pubk_2, kh_2] = await arkgInstance.derivePublicKey(pub_seed, ikm_2, ctx);
					assert.notDeepEqual(derived_pubk_1, derived_pubk_2);
					assert.notDeepEqual(toBase64(kh_1), toBase64(kh_2));
				});
			});

			describe("derivePrivateKey", () => {
				it("derives the same result on repeat calls.", async () => {
					const derived_prik_1 = await arkgInstance.derivePrivateKey(pri_seed, kh, ctx);
					const derived_prik_2 = await arkgInstance.derivePrivateKey(pri_seed, kh, ctx);
					assert.equal(derived_prik_1, derived_prik_2);
				});

				it("fails if any bit of the key handle is modified.", async () => {
					const kh_u8 = new Uint8Array(kh);
					for (let i = 0; i < kh.byteLength * 8; ++i) {
						const kh_mod = new Uint8Array([...kh_u8]);
						const byte_i = Math.floor(i / 8);
						const bit_i = i % 8;
						kh_mod[byte_i] = kh_mod[byte_i] ^ (0x01 << bit_i);
						await asyncAssertThrows(
							async () => await arkgInstance.derivePrivateKey(pri_seed, kh_mod, ctx),
							`Expected key handle modified at bit index ${bit_i} of byte index ${byte_i} to fail. Unmodified: ${toHex(kh)}; modified: ${toHex(kh_mod)}`,
						);
					}
				});

				it("derives the wrong private key if any bit of the key handle is modified.", async () => {
					const kh_u8 = new Uint8Array(kh);
					for (let i = 0; i < kh.byteLength * 8; ++i) {
						const kh_mod = new Uint8Array([...kh_u8]);
						const byte_i = Math.floor(i / 8);
						const bit_i = i % 8;
						kh_mod[byte_i] = kh_mod[byte_i] ^ (0x01 << bit_i);
						await asyncAssertThrows(
							async () => {
								const derived_prik = await arkgInstance.derivePrivateKey(pri_seed, kh_mod, ctx)
								const publicKey = await ec.publicKeyFromPoint(signAlgorithm.name, namedCurve, derived_pubk);
								const privateKey = await ec.privateKeyFromScalar(signAlgorithm.name, namedCurve, derived_prik, false, ["sign"]);
								const sig = await crypto.subtle.sign(signAlgorithm, privateKey, ctx);
								const valid = await crypto.subtle.verify(signAlgorithm, publicKey, sig, concat(ctx));
								assert.isFalse(valid, "Unexpected valid signature");
							},
							`Expected key handle modified at bit index ${bit_i} of byte index ${byte_i} to result in the wrong private key. Unmodified: ${toHex(kh)}; modified: ${toHex(kh_mod)}`,
						);
					}
				}, { timeout: 60000 });

				describe("passes test vectors:", async () => {
					async function runTestVector(
						ctx: string,
						ikmBlHex: string,
						ikmKemHex: string,
						ikmHex: string,
						expectPkBlRawHex: string,
						expectPkKemRawHex: string,
						expectSkBlHex: string,
						expectSkKemHex: string,
						expectDerivedPkRawHex: string,
						expectDerivedSkHex: string,
					) {
						it(ctx, async () => {
							const ctxBytes = new TextEncoder().encode(ctx);
							const arkgInstance = getEcInstance('ARKG-P256');

							const [seed_pk, seed_sk] = await arkgInstance.deriveSeed(fromHex(ikmBlHex), fromHex(ikmKemHex));
							assert.deepEqual(seed_pk.pubk_bl, await ec.pointFromRaw(crv, fromHex(expectPkBlRawHex)));
							assert.deepEqual(
								await ec.pointFromPublicKey(crv, seed_pk.pubk_kem),
								await ec.pointFromRaw(crv, fromHex(expectPkKemRawHex)),
							);
							assert.deepEqual(seed_sk.prik_bl, BigInt("0x" + expectSkBlHex));
							assert.deepEqual(await ec.scalarFromPrivateKey(seed_sk.prik_kem), BigInt("0x" + expectSkKemHex));

							const [derivedPubKey, kh] = await arkgInstance.derivePublicKey(seed_pk, fromHex(ikmHex), ctxBytes);
							assert.deepEqual(derivedPubKey, await ec.pointFromRaw(crv, fromHex(expectDerivedPkRawHex)));

							const derivedPrivateKey = await arkgInstance.derivePrivateKey(seed_sk, kh, ctxBytes);
							assert.equal(
								derivedPrivateKey,
								BigInt("0x" + expectDerivedSkHex),
							);
						});
					}

					await runTestVector(
						"ARKG-P256.test vectors",
						"000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
						"202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f",
						"404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f",
						"046d3bdf31d0db48988f16d47048fdd24123cd286e42d0512daa9f726b4ecf18df65ed42169c69675f936ff7de5f9bd93adbc8ea73036b16e8d90adbfabdaddba7",
						"04c38bbdd7286196733fa177e43b73cfd3d6d72cd11cc0bb2c9236cf85a42dcff5dfa339c1e07dfcdfda8d7be2a5a3c7382991f387dfe332b1dd8da6e0622cfb35",
						"d959500a78ccf850ce46c80a8c5043c9a2e33844232b3829df37d05b3069f455",
						"74e0a4cd81ca2d24246ff75bfd6d4fb7f9dfc938372627feb2c2348f8b1493b5",
						"04572a111ce5cfd2a67d56a0f7c684184b16ccd212490dc9c5b579df749647d107dac2a1b197cc10d2376559ad6df6bc107318d5cfb90def9f4a1f5347e086c2cd",
						"775d7fe9a6dfba43ce671cb38afca3d272c4d14aff97bd67559eb500a092e5e7",
					);
					await runTestVector(
						"ARKG-P256.test vectors",
						"000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
						"202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f",
						"a0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebf",
						"046d3bdf31d0db48988f16d47048fdd24123cd286e42d0512daa9f726b4ecf18df65ed42169c69675f936ff7de5f9bd93adbc8ea73036b16e8d90adbfabdaddba7",
						"04c38bbdd7286196733fa177e43b73cfd3d6d72cd11cc0bb2c9236cf85a42dcff5dfa339c1e07dfcdfda8d7be2a5a3c7382991f387dfe332b1dd8da6e0622cfb35",
						"d959500a78ccf850ce46c80a8c5043c9a2e33844232b3829df37d05b3069f455",
						"74e0a4cd81ca2d24246ff75bfd6d4fb7f9dfc938372627feb2c2348f8b1493b5",
						"04ea7d962c9f44ffe8b18f1058a471f394ef81b674948eefc1865b5c021cf858f577f9632b84220e4a1444a20b9430b86731c37e4dcb285eda38d76bf758918d86",
						"6228e470290e9d7cc0feff32a74caafa14c608c956337eba23997f5904cff226",
					);
					await runTestVector(
						"ARKG-P256.test vectors.0",
						"000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
						"202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f",
						"404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f",
						"046d3bdf31d0db48988f16d47048fdd24123cd286e42d0512daa9f726b4ecf18df65ed42169c69675f936ff7de5f9bd93adbc8ea73036b16e8d90adbfabdaddba7",
						"04c38bbdd7286196733fa177e43b73cfd3d6d72cd11cc0bb2c9236cf85a42dcff5dfa339c1e07dfcdfda8d7be2a5a3c7382991f387dfe332b1dd8da6e0622cfb35",
						"d959500a78ccf850ce46c80a8c5043c9a2e33844232b3829df37d05b3069f455",
						"74e0a4cd81ca2d24246ff75bfd6d4fb7f9dfc938372627feb2c2348f8b1493b5",
						"04b79b65d6bbb419ff97006a1bd52e3f4ad53042173992423e06e52987a037cb61dd82b126b162e4e7e8dc5c9fd86e82769d402a1968c7c547ef53ae4f96e10b0e",
						"2a97f4232f9abba32fbfc28c6686f8afd2d851c2a95a3ed2f0a384b9ad55068d",
					);
				});
			});
		});
	}
});
