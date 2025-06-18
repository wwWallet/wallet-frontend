import { assert, describe, it } from "vitest";

import { concat, fromHex, toHex } from "../util";
import { getCipherSuite } from "./ietf-bbs";


describe("Suite:", () => {

	const suiteId = 'BBS_BLS12381G1_XMD:SHA-256_SSWU_RO_';

	describe(suiteId, () => {
		describe("hash_to_scalar", () => {
			it("passes test vectors", async () => {
				const msg = fromHex("9872ad089e452c7b6e283dfac2a80d58e8d0ff71cc4d5e310a1debdda4a45f02");
				const dst = fromHex("4242535f424c53313233383147315f584d443a5348412d3235365f535357555f524f5f4832475f484d32535f4832535f");
				const { hash_to_scalar } = getCipherSuite(suiteId, dst);
				const scalar = await hash_to_scalar(msg, dst);
				assert.equal(scalar, 0x0f90cbee27beb214e6545becb8404640d3612da5d6758dffeccd77ed7169807cn);
			});
		});

		describe("keyGen", () => {
			it("passes test vectors", async () => {
				// https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-key-pair-2
				const key_material = fromHex("746869732d49532d6a7573742d616e2d546573742d494b4d2d746f2d67656e65726174652d246528724074232d6b6579");
				const key_info = fromHex("746869732d49532d736f6d652d6b65792d6d657461646174612d746f2d62652d757365642d696e2d746573742d6b65792d67656e");
				const dst = new TextEncoder().encode('irrelevant, this is not used in expand_message');
				const { api_id, KeyGen } = getCipherSuite(suiteId, dst);
				const key_dst = concat(api_id, new TextEncoder().encode("KEYGEN_DST_"));
				const SK = await KeyGen(key_material, key_info, key_dst);

				assert.equal(SK, 0x60e55110f76883a13d030b2f6bd11883422d5abde717569fc0731f51237169fcn);
			});
		});

		describe("messages_to_scalars", () => {
			it("passes test vectors", async () => {
				// https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-map-messages-to-scalars-2
				const dst = fromHex('4242535f424c53313233383147315f584d443a5348412d3235365f535357555f524f5f4832475f484d32535f4d41505f4d53475f544f5f5343414c41525f41535f484153485f');
				const { api_id, messages_to_scalars } = getCipherSuite(suiteId, dst);
				// https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-messages-2
				const messages = [
					"9872ad089e452c7b6e283dfac2a80d58e8d0ff71cc4d5e310a1debdda4a45f02",
					"c344136d9ab02da4dd5908bbba913ae6f58c2cc844b802a6f811f5fb075f9b80",
					"7372e9daa5ed31e6cd5c825eac1b855e84476a1d94932aa348e07b73",
					"77fe97eb97a1ebe2e81e4e3597a3ee740a66e9ef2412472c",
					"496694774c5604ab1b2544eababcf0f53278ff50",
					"515ae153e22aae04ad16f759e07237b4",
					"d183ddc6e2665aa4e2f088af",
					"ac55fb33a75909ed",
					"96012096",
					"",
				].map(fromHex);
				const scalars = await messages_to_scalars(messages, api_id);

				assert.equal(scalars.length, 10);
				assert.equal(scalars[0], 0x1cb5bb86114b34dc438a911617655a1db595abafac92f47c5001799cf624b430n);
				assert.equal(scalars[1], 0x154249d503c093ac2df516d4bb88b510d54fd97e8d7121aede420a25d9521952n);
				assert.equal(scalars[2], 0x0c7c4c85cdab32e6fdb0de267b16fa3212733d4e3a3f0d0f751657578b26fe22n);
				assert.equal(scalars[3], 0x4a196deafee5c23f630156ae13be3e46e53b7e39094d22877b8cba7f14640888n);
				assert.equal(scalars[4], 0x34c5ea4f2ba49117015a02c711bb173c11b06b3f1571b88a2952b93d0ed4cf7en);
				assert.equal(scalars[5], 0x4045b39b83055cd57a4d0203e1660800fabe434004dbdc8730c21ce3f0048b08n);
				assert.equal(scalars[6], 0x064621da4377b6b1d05ecc37cf3b9dfc94b9498d7013dc5c4a82bf3bb1750743n);
				assert.equal(scalars[7], 0x34ac9196ace0a37e147e32319ea9b3d8cc7d21870d3c3ba071246859cca49b02n);
				assert.equal(scalars[8], 0x57eb93f417c43200e9784fa5ea5a59168d3dbc38df707a13bb597c871b2a5f74n);
				assert.equal(scalars[9], 0x08e3afeb2b4f2b5f907924ef42856616e6f2d5f1fb373736db1cca32707a7d16n);
			});
		});

		describe("create_generators", () => {
			it("passes test vectors", async () => {
				const { api_id, create_generators } = getCipherSuite(suiteId, new TextEncoder().encode("irrelevant, this is not used in expand_message"));
				const count = 11;
				const generators = await create_generators(count, api_id);

				assert.equal(generators.length, count);
				assert.equal(toHex(generators[0].toBytes()), "a9ec65b70a7fbe40c874c9eb041c2cb0a7af36ccec1bea48fa2ba4c2eb67ef7f9ecb17ed27d38d27cdeddff44c8137be");
				assert.equal(toHex(generators[1].toBytes()), "98cd5313283aaf5db1b3ba8611fe6070d19e605de4078c38df36019fbaad0bd28dd090fd24ed27f7f4d22d5ff5dea7d4");
				assert.equal(toHex(generators[2].toBytes()), "a31fbe20c5c135bcaa8d9fc4e4ac665cc6db0226f35e737507e803044093f37697a9d452490a970eea6f9ad6c3dcaa3a");
				assert.equal(toHex(generators[3].toBytes()), "b479263445f4d2108965a9086f9d1fdc8cde77d14a91c856769521ad3344754cc5ce90d9bc4c696dffbc9ef1d6ad1b62");
				assert.equal(toHex(generators[4].toBytes()), "ac0401766d2128d4791d922557c7b4d1ae9a9b508ce266575244a8d6f32110d7b0b7557b77604869633bb49afbe20035");
				assert.equal(toHex(generators[5].toBytes()), "b95d2898370ebc542857746a316ce32fa5151c31f9b57915e308ee9d1de7db69127d919e984ea0747f5223821b596335");
				assert.equal(toHex(generators[6].toBytes()), "8f19359ae6ee508157492c06765b7df09e2e5ad591115742f2de9c08572bb2845cbf03fd7e23b7f031ed9c7564e52f39");
				assert.equal(toHex(generators[7].toBytes()), "abc914abe2926324b2c848e8a411a2b6df18cbe7758db8644145fefb0bf0a2d558a8c9946bd35e00c69d167aadf304c1");
				assert.equal(toHex(generators[8].toBytes()), "80755b3eb0dd4249cbefd20f177cee88e0761c066b71794825c9997b551f24051c352567ba6c01e57ac75dff763eaa17");
				assert.equal(toHex(generators[9].toBytes()), "82701eb98070728e1769525e73abff1783cedc364adb20c05c897a62f2ab2927f86f118dcb7819a7b218d8f3fee4bd7f");
				assert.equal(toHex(generators[10].toBytes()), "a1f229540474f4d6f1134761b92b788128c7ac8dc9b0c52d59493132679673032ac7db3fb3d79b46b13c1c41ee495bca");
			});

			it("generates the correct P1", async () => {
				// See: https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-bls12-381-ciphersuites
				const { params: { P1 }, create_generators } = getCipherSuite(
					suiteId,
					new TextEncoder().encode("irrelevant, this is not used in expand_message"),
					{
						sig_generator_seed: new TextEncoder().encode("H2G_HM2S_SIG_GENERATOR_SEED_"),
						sig_generator_dst: new TextEncoder().encode("H2G_HM2S_SIG_GENERATOR_DST_"),
						message_generator_seed: new TextEncoder().encode("H2G_HM2S_BP_MESSAGE_GENERATOR_SEED"),
					}
				);

				const api_id = new TextEncoder().encode(suiteId);
				const generators = await create_generators(1, api_id);

				assert.equal(generators.length, 1);
				assert.equal(toHex(generators[0].toBytes()), toHex(P1.toBytes()));
				assert.equal(toHex(generators[0].toBytes()), "a8ce256102840821a3e94ea9025e4662b205762f9776b3a766c872b948f1fd225e7c59698588e70d11406d161b4e28c9");
			});
		});

		describe("Sign", () => {
			describe("passes test vectors:", async () => {
				// https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-signature-fixtures-2
				it("Valid Single Message Signature", async () => {
					// https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-valid-single-message-signatu
					const { Sign } = getCipherSuite(suiteId, new TextEncoder().encode("irrelevant, this is not used in expand_message"));

					const m_1 = fromHex("9872ad089e452c7b6e283dfac2a80d58e8d0ff71cc4d5e310a1debdda4a45f02");
					const SK = 0x60e55110f76883a13d030b2f6bd11883422d5abde717569fc0731f51237169fcn;
					const PK = fromHex("a820f230f6ae38503b86c70dc50b61c58a77e45c39ab25c0652bbaa8fa136f2851bd4781c9dcde39fc9d1d52c9e60268061e7d7632171d91aa8d460acee0e96f1e7c4cfb12d3ff9ab5d5dc91c277db75c845d649ef3c4f63aebc364cd55ded0c");
					const header = fromHex("11223344556677889900aabbccddeeff");
					const expectSignature = fromHex("84773160b824e194073a57493dac1a20b667af70cd2352d8af241c77658da5253aa8458317cca0eae615690d55b1f27164657dcafee1d5c1973947aa70e2cfbb4c892340be5969920d0916067b4565a0");

					const signature = await Sign(SK, PK, header, [m_1]);

					assert.equal(toHex(signature), toHex(expectSignature));
				});

				it("Valid Multi-Message Signature", async () => {
					// https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-valid-multi-message-signatur
					const { Sign } = getCipherSuite(suiteId, new TextEncoder().encode("irrelevant, this is not used in expand_message"));

					const messages = [
						"9872ad089e452c7b6e283dfac2a80d58e8d0ff71cc4d5e310a1debdda4a45f02",
						"c344136d9ab02da4dd5908bbba913ae6f58c2cc844b802a6f811f5fb075f9b80",
						"7372e9daa5ed31e6cd5c825eac1b855e84476a1d94932aa348e07b73",
						"77fe97eb97a1ebe2e81e4e3597a3ee740a66e9ef2412472c",
						"496694774c5604ab1b2544eababcf0f53278ff50",
						"515ae153e22aae04ad16f759e07237b4",
						"d183ddc6e2665aa4e2f088af",
						"ac55fb33a75909ed",
						"96012096",
						"",
					].map(fromHex);
					const SK = 0x60e55110f76883a13d030b2f6bd11883422d5abde717569fc0731f51237169fcn;
					const PK = fromHex("a820f230f6ae38503b86c70dc50b61c58a77e45c39ab25c0652bbaa8fa136f2851bd4781c9dcde39fc9d1d52c9e60268061e7d7632171d91aa8d460acee0e96f1e7c4cfb12d3ff9ab5d5dc91c277db75c845d649ef3c4f63aebc364cd55ded0c");
					const header = fromHex("11223344556677889900aabbccddeeff");
					const expectSignature = fromHex("8339b285a4acd89dec7777c09543a43e3cc60684b0a6f8ab335da4825c96e1463e28f8c5f4fd0641d19cec5920d3a8ff4bedb6c9691454597bbd298288abed3632078557b2ace7d44caed846e1a0a1e8");

					const signature = await Sign(SK, PK, header, messages);

					assert.equal(toHex(signature), toHex(expectSignature));
				});
			});
		});
	});
});
