import { assert, describe, it } from "vitest";

import { concat, fromHex, toHex, toU8 } from "../util";
import { asyncAssertThrows } from "../testutil";
import { getCipherSuite } from "./ietf-bbs";


describe("Suite:", () => {

	const suiteId = 'BBS_BLS12381G1_XMD:SHA-256_SSWU_RO_';

	describe(suiteId, () => {

		/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-messages-2 */
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
						create_generators_dsts: {
							sig_generator_seed: new TextEncoder().encode("H2G_HM2S_SIG_GENERATOR_SEED_"),
							sig_generator_dst: new TextEncoder().encode("H2G_HM2S_SIG_GENERATOR_DST_"),
							message_generator_seed: new TextEncoder().encode("H2G_HM2S_BP_MESSAGE_GENERATOR_SEED"),
						},
					}
				);

				const api_id = new TextEncoder().encode(suiteId);
				const generators = await create_generators(1, api_id);

				assert.equal(generators.length, 1);
				assert.equal(toHex(generators[0].toBytes()), toHex(P1.toBytes()));
				assert.equal(toHex(generators[0].toBytes()), "a8ce256102840821a3e94ea9025e4662b205762f9776b3a766c872b948f1fd225e7c59698588e70d11406d161b4e28c9");
			});
		});

		describe("Sign and Verify", () => {

			// https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-signature-fixtures-2
			describe("pass test vectors:", async () => {

				const SK = 0x60e55110f76883a13d030b2f6bd11883422d5abde717569fc0731f51237169fcn;
				const PK = fromHex("a820f230f6ae38503b86c70dc50b61c58a77e45c39ab25c0652bbaa8fa136f2851bd4781c9dcde39fc9d1d52c9e60268061e7d7632171d91aa8d460acee0e96f1e7c4cfb12d3ff9ab5d5dc91c277db75c845d649ef3c4f63aebc364cd55ded0c");
				const header = fromHex("11223344556677889900aabbccddeeff");
				const signature = fromHex("8339b285a4acd89dec7777c09543a43e3cc60684b0a6f8ab335da4825c96e1463e28f8c5f4fd0641d19cec5920d3a8ff4bedb6c9691454597bbd298288abed3632078557b2ace7d44caed846e1a0a1e8");

				it("Valid Single Message Signature", async () => {
					// https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-valid-single-message-signatu
					const { Sign, Verify } = getCipherSuite(suiteId, new TextEncoder().encode("irrelevant, this is not used in expand_message"));

					const m_1 = fromHex("9872ad089e452c7b6e283dfac2a80d58e8d0ff71cc4d5e310a1debdda4a45f02");
					const expectSignature = fromHex("84773160b824e194073a57493dac1a20b667af70cd2352d8af241c77658da5253aa8458317cca0eae615690d55b1f27164657dcafee1d5c1973947aa70e2cfbb4c892340be5969920d0916067b4565a0");

					const signature = toU8(await Sign(SK, PK, header, [m_1]));

					assert.equal(toHex(signature), toHex(expectSignature));

					const valid = await Verify(PK, signature, header, [m_1]);
					assert.equal(valid, true);

					await asyncAssertThrows(() => Verify(PK, signature, header, null), "Expected signature verification to fail with wrong messages");
					await asyncAssertThrows(() => Verify(PK, signature, header, [m_1, m_1]), "Expected signature verification to fail with wrong messages");
					await asyncAssertThrows(() => Verify(PK, signature, null, [m_1]), "Expected signature verification to fail with wrong header");
					await asyncAssertThrows(() => Verify(PK, signature, concat(header, header), [m_1]), "Expected signature verification to fail with wrong header");
					const modSig = concat(new Uint8Array([signature[0] ^ 0x01]), signature.slice(1));
					await asyncAssertThrows(() => Verify(PK, modSig, header, [m_1]), "Expected signature verification to fail with wrong signature");
				});

				it("Valid Multi-Message Signature", async () => {
					// https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-valid-multi-message-signatur
					const { Sign, Verify } = getCipherSuite(suiteId, new TextEncoder().encode("irrelevant, this is not used in expand_message"));

					assert.equal(toHex(await Sign(SK, PK, header, messages)), toHex(signature));

					const valid = await Verify(PK, signature, header, messages);
					assert.equal(valid, true);

					const reverseMessages = [...messages].reverse();
					await asyncAssertThrows(() => Verify(PK, signature, header, null), "Expected signature verification to fail with wrong messages");
					await asyncAssertThrows(() => Verify(PK, signature, header, messages.slice(0, 9)), "Expected signature verification to fail with wrong messages");
					await asyncAssertThrows(() => Verify(PK, signature, header, reverseMessages), "Expected signature verification to fail with wrong messages");
					await asyncAssertThrows(() => Verify(PK, signature, null, messages), "Expected signature verification to fail with wrong header");
					await asyncAssertThrows(() => Verify(PK, signature, concat(header, header), messages), "Expected signature verification to fail with wrong header");
					const modSig = concat(new Uint8Array([signature[0] ^ 0x01]), signature.slice(1));
					await asyncAssertThrows(() => Verify(PK, modSig, header, messages), "Expected signature verification to fail with wrong signature");
				});

				// https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-no-header-valid-signature-2
				it("No Header Valid Signature", async () => {
					const { Sign, Verify } = getCipherSuite(suiteId, new TextEncoder().encode("irrelevant, this is not used in expand_message"));

					const header = fromHex("");
					const expectSignature = fromHex("8c87e2080859a97299c148427cd2fcf390d24bea850103a9748879039262ecf4f42206f6ef767f298b6a96b424c1e86c26f8fba62212d0e05b95261c2cc0e5fdc63a32731347e810fd12e9c58355aa0d");

					const signature = toU8(await Sign(SK, PK, header, messages));
					assert.equal(toHex(signature), toHex(expectSignature));

					const valid = await Verify(PK, signature, header, messages);
					assert.equal(valid, true);
				});

				// https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-modified-message-signature-2
				it("Modified Message Signature", async () => {
					const { Sign, Verify } = getCipherSuite(suiteId, new TextEncoder().encode("irrelevant, this is not used in expand_message"));

					const modifiedMessages = [""].map(fromHex);
					const signature = fromHex("84773160b824e194073a57493dac1a20b667af70cd2352d8af241c77658da5253aa8458317cca0eae615690d55b1f27164657dcafee1d5c1973947aa70e2cfbb4c892340be5969920d0916067b4565a0");

					assert.equal(toHex(await Sign(SK, PK, header, [messages[0]])), toHex(signature));
					await asyncAssertThrows(() => Verify(PK, signature, header, modifiedMessages), "Expected negative test case to fail signature verification");
				});

				// https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-extra-unsigned-message-signa
				it("Extra Unsigned Message Signature", async () => {
					const { Sign, Verify } = getCipherSuite(suiteId, new TextEncoder().encode("irrelevant, this is not used in expand_message"));

					const modifiedMessages = [
						"9872ad089e452c7b6e283dfac2a80d58e8d0ff71cc4d5e310a1debdda4a45f02",
						"c344136d9ab02da4dd5908bbba913ae6f58c2cc844b802a6f811f5fb075f9b80", // Omitted in signature
					].map(fromHex);
					const signature = fromHex("84773160b824e194073a57493dac1a20b667af70cd2352d8af241c77658da5253aa8458317cca0eae615690d55b1f27164657dcafee1d5c1973947aa70e2cfbb4c892340be5969920d0916067b4565a0");

					assert.equal(toHex(await Sign(SK, PK, header, [messages[0]])), toHex(signature));
					await asyncAssertThrows(() => Verify(PK, signature, header, modifiedMessages), "Expected negative test case to fail signature verification");
				});

				// https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-missing-message-signature-2
				it("Missing Message Signature", async () => {
					const { Sign, Verify } = getCipherSuite(suiteId, new TextEncoder().encode("irrelevant, this is not used in expand_message"));

					const modifiedMessages = [
						"9872ad089e452c7b6e283dfac2a80d58e8d0ff71cc4d5e310a1debdda4a45f02",
						"c344136d9ab02da4dd5908bbba913ae6f58c2cc844b802a6f811f5fb075f9b80",
					].map(fromHex);

					assert.equal(toHex(await Sign(SK, PK, header, messages)), toHex(signature));
					await asyncAssertThrows(() => Verify(PK, signature, header, modifiedMessages), "Expected negative test case to fail signature verification");
				});

				// https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-reordered-message-signature-2
				it("Reordered Message Signature", async () => {
					const { Sign, Verify } = getCipherSuite(suiteId, new TextEncoder().encode("irrelevant, this is not used in expand_message"));

					const modifiedMessages = [
						"",
						"96012096",
						"ac55fb33a75909ed",
						"d183ddc6e2665aa4e2f088af",
						"515ae153e22aae04ad16f759e07237b4",
						"496694774c5604ab1b2544eababcf0f53278ff50",
						"77fe97eb97a1ebe2e81e4e3597a3ee740a66e9ef2412472c",
						"7372e9daa5ed31e6cd5c825eac1b855e84476a1d94932aa348e07b73",
						"c344136d9ab02da4dd5908bbba913ae6f58c2cc844b802a6f811f5fb075f9b80",
						"9872ad089e452c7b6e283dfac2a80d58e8d0ff71cc4d5e310a1debdda4a45f02",
					].map(fromHex);

					assert.equal(toHex(await Sign(SK, PK, header, messages)), toHex(signature));
					await asyncAssertThrows(() => Verify(PK, signature, header, modifiedMessages), "Expected negative test case to fail signature verification");
				});

				// https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-wrong-public-key-signature-2
				it("Wrong Public Key Signature", async () => {
					const { Sign, Verify } = getCipherSuite(suiteId, new TextEncoder().encode("irrelevant, this is not used in expand_message"));

					const wrongPK = fromHex("b064bd8d1ba99503cbb7f9d7ea00bce877206a85b1750e5583dd9399828a4d20610cb937ea928d90404c239b2835ffb104220a9c66a4c9ed3b54c0cac9ea465d0429556b438ceefb59650ddf67e7a8f103677561b7ef7fe3c3357ec6b94d41c6");

					assert.equal(toHex(await Sign(SK, PK, header, messages)), toHex(signature));
					await asyncAssertThrows(() => Verify(wrongPK, signature, header, messages), "Expected negative test case to fail signature verification");
				});

				// https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-wrong-header-signature-2
				it("Wrong Header Signature", async () => {
					const { Sign, Verify } = getCipherSuite(suiteId, new TextEncoder().encode("irrelevant, this is not used in expand_message"));

					const wrongHeader = fromHex("ffeeddccbbaa00998877665544332211");

					assert.equal(toHex(await Sign(SK, PK, header, messages)), toHex(signature));
					await asyncAssertThrows(() => Verify(PK, signature, wrongHeader, messages), "Expected negative test case to fail signature verification");
				});
			});
		});

		describe("ProofGen and ProofVerify", () => {
			// https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-proof-fixtures-2
			describe("pass test vectors:", async () => {

				const public_key = fromHex("a820f230f6ae38503b86c70dc50b61c58a77e45c39ab25c0652bbaa8fa136f2851bd4781c9dcde39fc9d1d52c9e60268061e7d7632171d91aa8d460acee0e96f1e7c4cfb12d3ff9ab5d5dc91c277db75c845d649ef3c4f63aebc364cd55ded0c");
				const header = fromHex("11223344556677889900aabbccddeeff");
				const signature = fromHex("8339b285a4acd89dec7777c09543a43e3cc60684b0a6f8ab335da4825c96e1463e28f8c5f4fd0641d19cec5920d3a8ff4bedb6c9691454597bbd298288abed3632078557b2ace7d44caed846e1a0a1e8");

				// https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-valid-single-message-proof-2
				it("Valid Single Message Proof", async () => {
					const defaultSuite = getCipherSuite(
						suiteId,
						new TextEncoder().encode("irrelevant, this is not used in expand_message"),
					);
					const { ProofGen, ProofVerify } = getCipherSuite(
						suiteId,
						new TextEncoder().encode("irrelevant, this is not used in expand_message"),
						{
							mocked_random_scalars_params: {
								SEED: fromHex("332e313431353932363533353839373933323338343632363433333833323739"),
								DST: concat(defaultSuite.api_id, new TextEncoder().encode("MOCK_RANDOM_SCALARS_DST_")),
							},
						},
					);

					const m_0 = fromHex("9872ad089e452c7b6e283dfac2a80d58e8d0ff71cc4d5e310a1debdda4a45f02");
					const signature = fromHex("84773160b824e194073a57493dac1a20b667af70cd2352d8af241c77658da5253aa8458317cca0eae615690d55b1f27164657dcafee1d5c1973947aa70e2cfbb4c892340be5969920d0916067b4565a0");
					const presentation_header = fromHex("bed231d880675ed101ead304512e043ade9958dd0241ea70b4b3957fba941501");
					const revealed_indexes = [0];
					const expectProof = fromHex("94916292a7a6bade28456c601d3af33fcf39278d6594b467e128a3f83686a104ef2b2fcf72df0215eeaf69262ffe8194a19fab31a82ddbe06908985abc4c9825788b8a1610942d12b7f5debbea8985296361206dbace7af0cc834c80f33e0aadaeea5597befbb651827b5eed5a66f1a959bb46cfd5ca1a817a14475960f69b32c54db7587b5ee3ab665fbd37b506830a49f21d592f5e634f47cee05a025a2f8f94e73a6c15f02301d1178a92873b6e8634bafe4983c3e15a663d64080678dbf29417519b78af042be2b3e1c4d08b8d520ffab008cbaaca5671a15b22c239b38e940cfeaa5e72104576a9ec4a6fad78c532381aeaa6fb56409cef56ee5c140d455feeb04426193c57086c9b6d397d9418");

					const proof = await ProofGen(public_key, signature, header, presentation_header, [m_0], revealed_indexes);
					assert.equal(toHex(proof), toHex(expectProof));

					const valid = await ProofVerify(public_key, proof, header, presentation_header, [m_0], revealed_indexes);
					assert.equal(valid, true);

					await asyncAssertThrows(() => ProofVerify(public_key, proof, header, presentation_header, [], []), "Expected proof verification to fail with fewer revealed messages");
				});

				// https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-valid-multi-message-all-mess
				it("Valid Multi-Message, All Messages Disclosed Proof", async () => {
					const defaultSuite = getCipherSuite(
						suiteId,
						new TextEncoder().encode("irrelevant, this is not used in expand_message"),
					);
					const { ProofGen, ProofVerify } = getCipherSuite(
						suiteId,
						new TextEncoder().encode("irrelevant, this is not used in expand_message"),
						{
							mocked_random_scalars_params: {
								SEED: fromHex("332e313431353932363533353839373933323338343632363433333833323739"),
								DST: concat(defaultSuite.api_id, new TextEncoder().encode("MOCK_RANDOM_SCALARS_DST_")),
							},
						},
					);

					const presentation_header = fromHex("bed231d880675ed101ead304512e043ade9958dd0241ea70b4b3957fba941501");
					const revealed_indexes = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
					const expectProof = fromHex("b1f468aec2001c4f54cb56f707c6222a43e5803a25b2253e67b2210ab2ef9eab52db2d4b379935c4823281eaf767fd37b08ce80dc65de8f9769d27099ae649ad4c9b4bd2cc23edcba52073a298087d2495e6d57aaae051ef741adf1cbce65c64a73c8c97264177a76c4a03341956d2ae45ed3438ce598d5cda4f1bf9507fecef47855480b7b30b5e4052c92a4360110c67327365763f5aa9fb85ddcbc2975449b8c03db1216ca66b310f07d0ccf12ab460cdc6003b677fed36d0a23d0818a9d4d098d44f749e91008cf50e8567ef936704c8277b7710f41ab7e6e16408ab520edc290f9801349aee7b7b4e318e6a76e028e1dea911e2e7baec6a6a174da1a22362717fbae1cd961d7bf4adce1d31c2ab");

					const proof = await ProofGen(public_key, signature, header, presentation_header, messages, revealed_indexes);
					assert.equal(toHex(proof), toHex(expectProof));

					const valid = await ProofVerify(public_key, proof, header, presentation_header, messages, revealed_indexes);
					assert.equal(valid, true);

					const reverseMessages = [...messages].reverse();
					await asyncAssertThrows(() => ProofVerify(public_key, proof, header, presentation_header, [], []), "Expected proof verification to fail with no revealed messages");
					await asyncAssertThrows(() => ProofVerify(public_key, proof, header, presentation_header, messages.slice(0, 9), revealed_indexes.slice(0, 9)), "Expected proof verification to fail with fewer revealed messages");
					await asyncAssertThrows(() => ProofVerify(public_key, proof, header, presentation_header, reverseMessages, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), "Expected proof verification to fail with reversed messages");
					await asyncAssertThrows(() => ProofVerify(public_key, proof, header, presentation_header, reverseMessages, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].reverse()), "Expected proof verification to fail with reversed messages");
				});
			});
		});
	});
});
