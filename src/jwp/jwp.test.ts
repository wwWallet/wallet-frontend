import { assert, describe, it } from "vitest";
import { bls12_381 } from "@noble/curves/bls12-381";

import { getCipherSuite, PointG1 } from "../bbs";
import { concat, fromBase64Url, toBase64Url, toHex } from "../util";
import { asyncAssertThrows } from "../testutil";
import { assembleIssuedJwp, assemblePresentationJwp, confirm, issueBbs, issueSplitBbs, parseIssuedJwp, parsePresentedJwp, presentBbs, presentSplitBbs, verify } from ".";


describe("JWP", () => {

	it("preserves zero-length payloads and proofs in issued JWPs.", () => {
		const jwp = assembleIssuedJwp({ alg: '' }, [new Uint8Array([])], [new Uint8Array([])]);
		const { parsed } = parseIssuedJwp(jwp);
		assert.exists(parsed.payloads);
		assert.equal(parsed.payloads.length, 1);
		assert.equal(parsed.payloads[0].byteLength, 0);
		assert.exists(parsed.proof);
		assert.equal(parsed.proof.length, 1);
		assert.equal(parsed.proof[0].byteLength, 0);
	});

	it("preserves absent payloads and proofs in issued JWPs.", () => {
		const jwp = assembleIssuedJwp({ alg: '' }, [], []);
		const { parsed } = parseIssuedJwp(jwp);
		assert.exists(parsed.payloads);
		assert.equal(parsed.payloads.length, 0);
		assert.exists(parsed.proof);
		assert.equal(parsed.proof.length, 0);
	});

	describe("preserves zero-length payloads and proofs in presented JWPs", () => {
		it("when issued JWP has one payload.", () => {
			const issuedJwp = assembleIssuedJwp({ alg: '' }, [new Uint8Array([])], [new Uint8Array([])]);
			const jwp = assemblePresentationJwp(issuedJwp, { alg: '' }, [0], [new Uint8Array([])]);
			const { parsed } = parsePresentedJwp(jwp);
			assert.exists(parsed.payloads);
			assert.equal(parsed.payloads.length, 1);
			assert.equal(parsed.payloads[0].byteLength, 0);
			assert.exists(parsed.proof);
			assert.equal(parsed.proof.length, 1);
			assert.equal(parsed.proof[0].byteLength, 0);
		});

		it("when issued JWP has two payloads and one is disclosed.", () => {
			const issuedJwp = assembleIssuedJwp({ alg: '' }, [new Uint8Array([]), new Uint8Array([])], [new Uint8Array([]), new Uint8Array([])]);
			const jwp = assemblePresentationJwp(issuedJwp, { alg: '' }, [0], [new Uint8Array([]), new Uint8Array([])]);
			const { parsed } = parsePresentedJwp(jwp);
			assert.exists(parsed.payloads);
			assert.equal(parsed.payloads.length, 2);
			assert.equal(parsed.payloads[0].byteLength, 0);
			assert.equal(parsed.payloads[1], null);
			assert.exists(parsed.proof);
			assert.equal(parsed.proof.length, 2);
			assert.equal(parsed.proof[0].byteLength, 0);
			assert.equal(parsed.proof[1].byteLength, 0);
		});
	});

	describe("preserves absent payloads and proofs in presented JWPs", () => {
		it("preserves absent payloads and proofs in presented JWPs.", () => {
			const issuedJwp = assembleIssuedJwp({ alg: '' }, [], []);
			const jwp = assemblePresentationJwp(issuedJwp, { alg: '' }, [], []);
			const { parsed } = parsePresentedJwp(jwp);
			assert.exists(parsed.payloads);
			assert.equal(parsed.payloads.length, 0);
			assert.exists(parsed.proof);
			assert.equal(parsed.proof.length, 0);
		});

		it("when issued JWP has no payloads.", () => {
			const issuedJwp = assembleIssuedJwp({ alg: '' }, [], []);
			const jwp = assemblePresentationJwp(issuedJwp, { alg: '' }, [], []);
			const { parsed } = parsePresentedJwp(jwp);
			assert.exists(parsed.payloads);
			assert.equal(parsed.payloads.length, 0);
			assert.exists(parsed.proof);
			assert.equal(parsed.proof.length, 0);
		});

		it("when issued JWP has one payload which is not disclosed.", () => {
			const issuedJwp = assembleIssuedJwp({ alg: '' }, [new Uint8Array([])], [new Uint8Array([])]);
			const jwp = assemblePresentationJwp(issuedJwp, { alg: '' }, [], []);
			const { parsed } = parsePresentedJwp(jwp);
			assert.exists(parsed.payloads);
			assert.equal(parsed.payloads.length, 0); // This should really be 1 (`[null]`), but these cases are indistinguishable
			assert.exists(parsed.proof);
			assert.equal(parsed.proof.length, 0); // This should really be 1 (`[null]`), but these cases are indistinguishable
		});

		it("when issued JWP has two payloads and one is disclosed.", () => {
			const issuedJwp = assembleIssuedJwp({ alg: '' }, [new Uint8Array([]), new Uint8Array([])], [new Uint8Array([])]);
			const jwp = assemblePresentationJwp(issuedJwp, { alg: '' }, [1], []);
			const { parsed } = parsePresentedJwp(jwp);
			assert.exists(parsed.payloads);
			assert.equal(parsed.payloads.length, 2);
			assert.equal(parsed.payloads[0], null);
			assert.equal(parsed.payloads[1].byteLength, 0);
			assert.exists(parsed.proof);
			assert.equal(parsed.proof.length, 0);
		});
	});

	describe("With BBS", async () => {

		const suiteId = 'BBS_BLS12381G1_XMD:SHA-256_SSWU_RO_';
		const { KeyGen, SkToPk } = getCipherSuite(suiteId);
		const SK = await KeyGen(crypto.getRandomValues(new Uint8Array(32)), new TextEncoder().encode('JWP test BBS'), null);
		const PK = SkToPk(SK);

		describe("can issue and confirm a JWP", () => {
			it("with no payloads.", async () => {
				const issuedJwp = await issueBbs(
					SK, PK,
					{ alg: 'BBS', aud: 'JWP test' },
					[],
				);

				const valid = await confirm(PK, issuedJwp);
				assert.equal(valid, true);
				assert.equal(issuedJwp.split(".")[1], '');
			});

			it("with a single payload.", async () => {
				const issuedJwp = await issueBbs(
					SK, PK,
					{ alg: 'BBS', aud: 'JWP test' },
					[new TextEncoder().encode('Kom ihåg att du aldrig får snyta dig i mattan!')],
				);

				const valid = await confirm(PK, issuedJwp);
				assert.equal(valid, true);
				assert.equal(new TextDecoder().decode(fromBase64Url(issuedJwp.split(".")[1])), 'Kom ihåg att du aldrig får snyta dig i mattan!');
			});

			it("with multiple payloads.", async () => {
				const randomMessage = crypto.getRandomValues(new Uint8Array(32));
				const issuedJwp = await issueBbs(
					SK, PK,
					{ alg: 'BBS', aud: 'JWP test' },
					[
						new TextEncoder().encode('Kom ihåg att du aldrig får snyta dig i mattan!'),
						randomMessage,
						new TextEncoder().encode(JSON.stringify({ some: 'JSON', obj: ['foo', 42] })),
					],
				);

				const valid = await confirm(PK, issuedJwp);
				assert.equal(valid, true);
				const payloads = issuedJwp.split(".")[1].split('~').map(fromBase64Url);
				assert.equal(new TextDecoder().decode(payloads[0]), 'Kom ihåg att du aldrig får snyta dig i mattan!');
				assert.equal(toHex(payloads[1]), toHex(randomMessage));
				assert.deepEqual(
					JSON.parse(new TextDecoder().decode(payloads[2])),
					{ some: 'JSON', obj: ['foo', 42] },
				);
			});
		});

		describe("rejects an issued JWP", async () => {
			const issuedJwp = await issueBbs(
				SK, PK,
				{ alg: 'BBS', aud: 'JWP test' },
				[new TextEncoder().encode('Kom ihåg att du aldrig får snyta dig i mattan!')],
			);

			it("with a modified header.", async () => {
				await asyncAssertThrows(() => confirm(PK, issuedJwp.slice(1)), "");
			});

			it("without signature.", async () => {
				await asyncAssertThrows(() => confirm(PK, issuedJwp.split(".").slice(0, 2).join(".")), "");
			});

			it("with truncated signature.", async () => {
				await asyncAssertThrows(() => confirm(PK, issuedJwp.slice(0, issuedJwp.length - 4)), "");
			});

			it("with the payloads omitted.", async () => {
				await asyncAssertThrows(() => confirm(PK, issuedJwp.split(".").map((s, i) => i === 1 ? '' : s).join(".")), "");
			});

			it("with modified payloads.", async () => {
				await asyncAssertThrows(() => confirm(PK, issuedJwp.split(".").map((s, i) => i === 1 ? toBase64Url(new TextEncoder().encode('foo')) : s).join(".")), "");
			});
		});

		describe("can create and verify a JWP presentation", () => {
			it("with no payloads.", async () => {
				const issuedJwp = await issueBbs(
					SK, PK,
					{ alg: 'BBS', aud: 'JWP test' },
					[],
				);
				const presentedJwp = await presentBbs(
					PK,
					issuedJwp,
					{ alg: 'BBS', nonce: toBase64Url(crypto.getRandomValues(new Uint8Array(32))) },
					[],
				);

				const valid = await verify(PK, presentedJwp);
				assert.equal(valid, true);
				assert.equal(presentedJwp.split(".")[2], '');
			});

			it("with a single payload, disclosed.", async () => {
				const issuedJwp = await issueBbs(
					SK, PK,
					{ alg: 'BBS', aud: 'JWP test' },
					[new TextEncoder().encode('Kom ihåg att du aldrig får snyta dig i mattan!')],
				);
				const presentedJwp = await presentBbs(
					PK,
					issuedJwp,
					{ alg: 'BBS', nonce: toBase64Url(crypto.getRandomValues(new Uint8Array(32))) },
					[0],
				);

				const valid = await verify(PK, presentedJwp);
				assert.equal(valid, true);
				assert.equal(
					new TextDecoder().decode(fromBase64Url(presentedJwp.split(".")[2])),
					'Kom ihåg att du aldrig får snyta dig i mattan!',
				);
			});

			it("with a single payload, not disclosed.", async () => {
				const issuedJwp = await issueBbs(
					SK, PK,
					{ alg: 'BBS', aud: 'JWP test' },
					[new TextEncoder().encode('Kom ihåg att du aldrig får snyta dig i mattan!')],
				);
				const presentedJwp = await presentBbs(
					PK,
					issuedJwp,
					{ alg: 'BBS', nonce: toBase64Url(crypto.getRandomValues(new Uint8Array(32))) },
					[],
				);

				const valid = await verify(PK, presentedJwp);
				assert.equal(valid, true);
				assert.equal(presentedJwp.split(".")[2], '');
			});

			it("with multiple payloads, all disclosed.", async () => {
				const randomMessage = crypto.getRandomValues(new Uint8Array(32));
				const issuedJwp = await issueBbs(
					SK, PK,
					{ alg: 'BBS', aud: 'JWP test' },
					[
						new TextEncoder().encode('Kom ihåg att du aldrig får snyta dig i mattan!'),
						randomMessage,
						new TextEncoder().encode(JSON.stringify({ some: 'JSON', obj: ['foo', 42] })),
					],
				);
				const presentedJwp = await presentBbs(
					PK,
					issuedJwp,
					{ alg: 'BBS', nonce: toBase64Url(crypto.getRandomValues(new Uint8Array(32))) },
					[0, 1, 2],
				);

				const valid = await verify(PK, presentedJwp);
				assert.equal(valid, true);
				const payloads = presentedJwp.split(".")[2].split('~').map(fromBase64Url);
				assert.equal(new TextDecoder().decode(payloads[0]), 'Kom ihåg att du aldrig får snyta dig i mattan!');
				assert.equal(toHex(payloads[1]), toHex(randomMessage));
				assert.deepEqual(
					JSON.parse(new TextDecoder().decode(payloads[2])),
					{ some: 'JSON', obj: ['foo', 42] },
				);
			});

			it("with multiple payloads, some disclosed.", async () => {
				const randomMessage = crypto.getRandomValues(new Uint8Array(32));
				const issuedJwp = await issueBbs(
					SK, PK,
					{ alg: 'BBS', aud: 'JWP test' },
					[
						new TextEncoder().encode('Kom ihåg att du aldrig får snyta dig i mattan!'),
						randomMessage,
						new TextEncoder().encode(JSON.stringify({ some: 'JSON', obj: ['foo', 42] })),
					],
				);
				const presentedJwp = await presentBbs(
					PK,
					issuedJwp,
					{ alg: 'BBS', nonce: toBase64Url(crypto.getRandomValues(new Uint8Array(32))) },
					[0, 2],
				);

				const valid = await verify(PK, presentedJwp);
				assert.equal(valid, true);
				const payloads = presentedJwp.split(".")[2].split('~').map(fromBase64Url);
				assert.equal(new TextDecoder().decode(payloads[0]), 'Kom ihåg att du aldrig får snyta dig i mattan!');
				assert.equal(toHex(payloads[1]), '');
				assert.deepEqual(
					JSON.parse(new TextDecoder().decode(payloads[2])),
					{ some: 'JSON', obj: ['foo', 42] },
				);
			});

			it("with multiple payloads, none disclosed.", async () => {
				const randomMessage = crypto.getRandomValues(new Uint8Array(32));
				const issuedJwp = await issueBbs(
					SK, PK,
					{ alg: 'BBS', aud: 'JWP test' },
					[
						new TextEncoder().encode('Kom ihåg att du aldrig får snyta dig i mattan!'),
						randomMessage,
						new TextEncoder().encode(JSON.stringify({ some: 'JSON', obj: ['foo', 42] })),
					],
				);
				const presentedJwp = await presentBbs(
					PK,
					issuedJwp,
					{ alg: 'BBS', nonce: toBase64Url(crypto.getRandomValues(new Uint8Array(32))) },
					[],
				);

				const valid = await verify(PK, presentedJwp);
				assert.equal(valid, true);
				const payloads = presentedJwp.split(".")[2];
				assert.equal(payloads, '~~');
			});
		});

		describe("rejects a JWP presentation", async () => {
			const issuedJwp = await issueBbs(
				SK, PK,
				{ alg: 'BBS', aud: 'JWP test' },
				[new TextEncoder().encode('Kom ihåg att du aldrig får snyta dig i mattan!')],
			);
			const presentedJwp = await presentBbs(
				PK,
				issuedJwp,
				{ alg: 'BBS', nonce: toBase64Url(crypto.getRandomValues(new Uint8Array(32))) },
				[0],
			);

			it("with a modified presentation header.", async () => {
				await asyncAssertThrows(() => verify(PK, presentedJwp.slice(1)), "");
			});

			it("with a modified issuer header.", async () => {
				await asyncAssertThrows(() => verify(PK, presentedJwp.split(".").map((s, i) => i === 1 ? s.slice(1) : s).join(".")), "");
			});

			it("without proof.", async () => {
				await asyncAssertThrows(() => verify(PK, presentedJwp.split(".").slice(0, 3).join(".")), "");
			});

			it("with truncated proof.", async () => {
				await asyncAssertThrows(() => verify(PK, presentedJwp.slice(0, presentedJwp.length - 4)), "");
			});

			it("with a disclosed payload omitted.", async () => {
				await asyncAssertThrows(() => verify(PK, presentedJwp.split(".").map((s, i) => i === 2 ? '' : s).join(".")), "");
			});

			it("with a modified payload.", async () => {
				await asyncAssertThrows(() => verify(PK, presentedJwp.split(".").map((s, i) => i === 2 ? toBase64Url(new TextEncoder().encode('foo')) : s).join(".")), "Expected JWP verification to fail with modified message");
			});
		});
	});

	describe("With Split-BBS", async () => {

		const suiteId = 'BBS_BLS12381G1_XMD:SHA-256_SSWU_RO_';
		const { KeyGen, SkToPk, SplitProofGenDevice } = getCipherSuite(suiteId);
		const SK = await KeyGen(crypto.getRandomValues(new Uint8Array(32)), new TextEncoder().encode('JWP test Split-BBS'), null);
		const PK = SkToPk(SK);
		const dsk = await KeyGen(crypto.getRandomValues(new Uint8Array(32)), new TextEncoder().encode('JWP test Split-BBS dsk'), null);
		const dpk = bls12_381.curves.G1.BASE.multiply(dsk).toBytes();
		const deviceSign = (T2bar: PointG1, c_host: bigint) => SplitProofGenDevice(dsk, bls12_381.curves.G1.BASE, c_host, T2bar);

		describe("can issue and confirm a JWP", () => {
			it("with no payloads.", async () => {
				const issuedJwp = await issueSplitBbs(
					SK, PK,
					{ alg: 'experimental/SplitBBSv2.1', aud: 'JWP test' },
					dpk,
					[],
				);

				const valid = await confirm(concat(PK, dpk), issuedJwp);
				assert.equal(valid, true);
				assert.equal(issuedJwp.split(".")[1], '');
			});

			it("with a single payload.", async () => {
				const issuedJwp = await issueSplitBbs(
					SK, PK,
					{ alg: 'experimental/SplitBBSv2.1', aud: 'JWP test' },
					dpk,
					[new TextEncoder().encode('Kom ihåg att du aldrig får snyta dig i mattan!')],
				);

				const valid = await confirm(concat(PK, dpk), issuedJwp);
				assert.equal(valid, true);
			});

			it("with multiple payloads.", async () => {
				const issuedJwp = await issueSplitBbs(
					SK, PK,
					{ alg: 'experimental/SplitBBSv2.1', aud: 'JWP test' },
					dpk,
					[
						new TextEncoder().encode('Kom ihåg att du aldrig får snyta dig i mattan!'),
						crypto.getRandomValues(new Uint8Array(32)),
						new TextEncoder().encode(JSON.stringify({ some: 'JSON', obj: ['foo', 42] })),
					],
				);

				const valid = await confirm(concat(PK, dpk), issuedJwp);
				assert.equal(valid, true);
			});
		});

		describe("rejects an issued JWP", async () => {
			const issuedJwp = await issueSplitBbs(
				SK, PK,
				{ alg: 'experimental/SplitBBSv2.1', aud: 'JWP test' },
				dpk,
				[new TextEncoder().encode('Kom ihåg att du aldrig får snyta dig i mattan!')],
			);

			it("with a modified header.", async () => {
				await asyncAssertThrows(() => confirm(concat(PK, dpk), issuedJwp.slice(1)), "");
			});

			it("without signature.", async () => {
				await asyncAssertThrows(() => confirm(concat(PK, dpk), issuedJwp.split(".").slice(0, 2).join(".")), "");
			});

			it("with truncated signature.", async () => {
				await asyncAssertThrows(() => confirm(concat(PK, dpk), issuedJwp.slice(0, issuedJwp.length - 4)), "");
			});

			it("with the payloads omitted.", async () => {
				await asyncAssertThrows(() => confirm(concat(PK, dpk), issuedJwp.split(".").map((s, i) => i === 1 ? '' : s).join(".")), "");
			});

			it("with modified payloads.", async () => {
				await asyncAssertThrows(() => confirm(concat(PK, dpk), issuedJwp.split(".").map((s, i) => i === 1 ? toBase64Url(new TextEncoder().encode('foo')) : s).join(".")), "");
			});
		});

		describe("can create and verify a JWP presentation", () => {
			it("with no payloads.", async () => {
				const issuedJwp = await issueSplitBbs(
					SK, PK,
					{ alg: 'experimental/SplitBBSv2.1', aud: 'JWP test' },
					dpk,
					[],
				);
				const presentedJwp = await presentSplitBbs(
					PK,
					dpk,
					issuedJwp,
					{ alg: 'experimental/SplitBBSv2.1', nonce: toBase64Url(crypto.getRandomValues(new Uint8Array(32))) },
					[],
					deviceSign,
				);

				const valid = await verify(PK, presentedJwp);
				assert.equal(valid, true);
				assert.equal(presentedJwp.split(".")[2], '');
			});

			it("with a single payload, disclosed.", async () => {
				const issuedJwp = await issueSplitBbs(
					SK, PK,
					{ alg: 'experimental/SplitBBSv2.1', aud: 'JWP test' },
					dpk,
					[new TextEncoder().encode('Kom ihåg att du aldrig får snyta dig i mattan!')],
				);
				const presentedJwp = await presentSplitBbs(
					PK,
					dpk,
					issuedJwp,
					{ alg: 'experimental/SplitBBSv2.1', nonce: toBase64Url(crypto.getRandomValues(new Uint8Array(32))) },
					[0],
					deviceSign,
				);

				const valid = await verify(PK, presentedJwp);
				assert.equal(valid, true);
				assert.equal(
					new TextDecoder().decode(fromBase64Url(presentedJwp.split(".")[2])),
					'Kom ihåg att du aldrig får snyta dig i mattan!',
				);
			});

			it("with a single payload, not disclosed.", async () => {
				const issuedJwp = await issueSplitBbs(
					SK, PK,
					{ alg: 'experimental/SplitBBSv2.1', aud: 'JWP test' },
					dpk,
					[new TextEncoder().encode('Kom ihåg att du aldrig får snyta dig i mattan!')],
				);
				const presentedJwp = await presentSplitBbs(
					PK,
					dpk,
					issuedJwp,
					{ alg: 'experimental/SplitBBSv2.1', nonce: toBase64Url(crypto.getRandomValues(new Uint8Array(32))) },
					[],
					deviceSign,
				);

				const valid = await verify(PK, presentedJwp);
				assert.equal(valid, true);
				assert.equal(presentedJwp.split(".")[2], '');
			});

			it("with multiple payloads, all disclosed.", async () => {
				const randomMessage = crypto.getRandomValues(new Uint8Array(32));
				const issuedJwp = await issueSplitBbs(
					SK, PK,
					{ alg: 'experimental/SplitBBSv2.1', aud: 'JWP test' },
					dpk,
					[
						new TextEncoder().encode('Kom ihåg att du aldrig får snyta dig i mattan!'),
						randomMessage,
						new TextEncoder().encode(JSON.stringify({ some: 'JSON', obj: ['foo', 42] })),
					],
				);
				const presentedJwp = await presentSplitBbs(
					PK,
					dpk,
					issuedJwp,
					{ alg: 'experimental/SplitBBSv2.1', nonce: toBase64Url(crypto.getRandomValues(new Uint8Array(32))) },
					[0, 1, 2],
					deviceSign,
				);

				const valid = await verify(PK, presentedJwp);
				assert.equal(valid, true);
				const payloads = presentedJwp.split(".")[2].split('~').map(fromBase64Url);
				assert.equal(new TextDecoder().decode(payloads[0]), 'Kom ihåg att du aldrig får snyta dig i mattan!');
				assert.equal(toHex(payloads[1]), toHex(randomMessage));
				assert.deepEqual(
					JSON.parse(new TextDecoder().decode(payloads[2])),
					{ some: 'JSON', obj: ['foo', 42] },
				);
			});

			it("with multiple payloads, some disclosed.", async () => {
				const randomMessage = crypto.getRandomValues(new Uint8Array(32));
				const issuedJwp = await issueSplitBbs(
					SK, PK,
					{ alg: 'experimental/SplitBBSv2.1', aud: 'JWP test' },
					dpk,
					[
						new TextEncoder().encode('Kom ihåg att du aldrig får snyta dig i mattan!'),
						randomMessage,
						new TextEncoder().encode(JSON.stringify({ some: 'JSON', obj: ['foo', 42] })),
					],
				);
				const presentedJwp = await presentSplitBbs(
					PK,
					dpk,
					issuedJwp,
					{ alg: 'experimental/SplitBBSv2.1', nonce: toBase64Url(crypto.getRandomValues(new Uint8Array(32))) },
					[0, 2],
					deviceSign
				);

				const valid = await verify(PK, presentedJwp);
				assert.equal(valid, true);
				const payloads = presentedJwp.split(".")[2].split('~').map(fromBase64Url);
				assert.equal(new TextDecoder().decode(payloads[0]), 'Kom ihåg att du aldrig får snyta dig i mattan!');
				assert.equal(toHex(payloads[1]), '');
				assert.deepEqual(
					JSON.parse(new TextDecoder().decode(payloads[2])),
					{ some: 'JSON', obj: ['foo', 42] },
				);
			});

			it("with multiple payloads, none disclosed.", async () => {
				const randomMessage = crypto.getRandomValues(new Uint8Array(32));
				const issuedJwp = await issueSplitBbs(
					SK, PK,
					{ alg: 'experimental/SplitBBSv2.1', aud: 'JWP test' },
					dpk,
					[
						new TextEncoder().encode('Kom ihåg att du aldrig får snyta dig i mattan!'),
						randomMessage,
						new TextEncoder().encode(JSON.stringify({ some: 'JSON', obj: ['foo', 42] })),
					],
				);
				const presentedJwp = await presentSplitBbs(
					PK,
					dpk,
					issuedJwp,
					{ alg: 'experimental/SplitBBSv2.1', nonce: toBase64Url(crypto.getRandomValues(new Uint8Array(32))) },
					[],
					deviceSign,
				);

				const valid = await verify(PK, presentedJwp);
				assert.equal(valid, true);
				const payloads = presentedJwp.split(".")[2];
				assert.equal(payloads, '~~');
			});
		});

		describe("rejects a JWP presentation", async () => {
			const issuedJwp = await issueSplitBbs(
				SK, PK,
				{ alg: 'experimental/SplitBBSv2.1', aud: 'JWP test' },
				dpk,
				[new TextEncoder().encode('Kom ihåg att du aldrig får snyta dig i mattan!')],
			);
			const presentedJwp = await presentSplitBbs(
				PK,
				dpk,
				issuedJwp,
				{ alg: 'experimental/SplitBBSv2.1', nonce: toBase64Url(crypto.getRandomValues(new Uint8Array(32))) },
				[0],
				deviceSign,
			);

			it("with a modified presentation header.", async () => {
				await asyncAssertThrows(() => verify(PK, presentedJwp.slice(1)), "");
			});

			it("with a modified issuer header.", async () => {
				await asyncAssertThrows(() => verify(PK, presentedJwp.split(".").map((s, i) => i === 1 ? s.slice(1) : s).join(".")), "");
			});

			it("without proof.", async () => {
				await asyncAssertThrows(() => verify(PK, presentedJwp.split(".").slice(0, 3).join(".")), "");
			});

			it("with truncated proof.", async () => {
				await asyncAssertThrows(() => verify(PK, presentedJwp.slice(0, presentedJwp.length - 4)), "");
			});

			it("with a disclosed payload omitted.", async () => {
				await asyncAssertThrows(() => verify(PK, presentedJwp.split(".").map((s, i) => i === 2 ? '' : s).join(".")), "");
			});

			it("with a modified payload.", async () => {
				await asyncAssertThrows(() => verify(PK, presentedJwp.split(".").map((s, i) => i === 2 ? toBase64Url(new TextEncoder().encode('foo')) : s).join(".")), "Expected JWP verification to fail with modified message");
			});
		});
	});
});
