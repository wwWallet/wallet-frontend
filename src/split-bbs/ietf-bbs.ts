/** Implementation of https://datatracker.ietf.org/doc/draft-irtf-cfrg-bbs-signatures/08/ */

import { IField } from "@noble/curves/abstract/modular";
import { Fp12, Fp12Bls, Fp2 } from "@noble/curves/abstract/tower";
import { ProjConstructor, ProjPointType } from "@noble/curves/abstract/weierstrass";
import { bls12_381 } from "@noble/curves/bls12-381";

import { concat, fromHex, I2OSP, OS2IP, toHex, toU8 } from "../util";
import { hashToCurve, HashToCurveSuite } from "../arkg/hash_to_curve";


function createSuite(suite: SuiteParams): CipherSuite {
	const {
		Fr,
		Fp12,
		G1,
		G2,
		P1,
		expand_len,
		h,
		hash_to_curve_g1,
		octet_point_length,
		octet_scalar_length,
		mocked_random_scalars_params,
	} = suite;
	const {
		sig_generator_seed,
		sig_generator_dst,
		message_generator_seed,
	} = suite.create_generators_dsts ?? {
		sig_generator_seed: new TextEncoder().encode("SIG_GENERATOR_SEED_"),
		sig_generator_dst: new TextEncoder().encode("SIG_GENERATOR_DST_"),
		message_generator_seed: new TextEncoder().encode("MESSAGE_GENERATOR_SEED"),
	};

	const { expand_message, prime_subgroup_order } = suite.hash_to_curve_suite.suiteParams;
	const api_id = new TextEncoder().encode(suite.id + "H2G_HM2S_");

	function sumprod(points: PointG1[], scalars: bigint[]): PointG1 {
		return points.reduce(
			(sum, Hi, i) => sum.add(Hi.multiply(scalars[i])),
			G1.ZERO,
		);
	}

	function get_random(n: number): BufferSource {
		return crypto.getRandomValues(new Uint8Array(n));
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-random-scalars */
	async function real_calculate_random_scalars(count: number): Promise<bigint[]> {
		return Array(count).fill(0n).map(() => Fr.create(OS2IP(get_random(expand_len))));
	};

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-random-scalars */
	async function seeded_random_scalars(
		{ SEED, DST }: { SEED: BufferSource, DST: BufferSource },
		count: number,
	): Promise<bigint[]> {
		const out_len = expand_len * count;
		if (out_len > 65536) {
			throw new Error("Output length too high", { cause: { count, expand_len, out_len } });
		}
		const v = toU8(await expand_message(SEED, DST, out_len));
		return Array(count).fill(0n).map((_, i) => Fr.create(OS2IP(v.slice(i * expand_len, (i + 1) * expand_len))));
	};

	const calculate_random_scalars: (count: number) => Promise<bigint[]> = (
		mocked_random_scalars_params
			? (count: number) => seeded_random_scalars(mocked_random_scalars_params, count)
			: real_calculate_random_scalars
	);

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-hash-to-scalar */
	async function hash_to_scalar(msg_octets: BufferSource, dst: BufferSource): Promise<bigint> {
		const uniform_bytes = await expand_message(msg_octets, dst, suite.expand_len);
		return OS2IP(uniform_bytes) % prime_subgroup_order;
	};

	async function calculate_domain(
		PK: BufferSource,
		Q_1: PointG1,
		H_Points: PointG1[],
		header: BufferSource,
		api_id: BufferSource,
	): Promise<bigint> {
		const hash_to_scalar_dst = concat(api_id, new TextEncoder().encode("H2S_"));
		const two64min1 = (1n << 64n) - 1n;
		const L = H_Points.length;
		if (header.byteLength > two64min1) {
			throw new Error(`header too long: expected length max ${two64min1}, got: ${header.byteLength}`, { cause: { header } });
		}
		if (H_Points.length > two64min1) {
			throw new Error(`H_Points too long: expected length max ${two64min1}, got: ${H_Points.length}`, { cause: { H_Points } });
		}

		const dom_array = [L, Q_1, ...H_Points];
		const dom_octs = concat(serialize(dom_array), api_id);
		const dom_input = concat(PK, dom_octs, I2OSP(BigInt(header.byteLength), 8), header);
		return hash_to_scalar(dom_input, hash_to_scalar_dst);
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#messages-to-scalars */
	function messages_to_scalars(
		messages: BufferSource[],
		api_id: BufferSource,
	): Promise<bigint[]> {
		if (messages.length >= Math.pow(2, 64)) {
			throw new Error(`Too many messages: ${messages.length} >= 2^64`, { cause: { length: messages.length } });
		}
		const map_msg_to_scalar_as_hash = new TextEncoder().encode("MAP_MSG_TO_SCALAR_AS_HASH_");
		const map_dst = concat(api_id, map_msg_to_scalar_as_hash);

		return Promise.all(messages.map(message => hash_to_scalar(message, map_dst)));
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-generators-calculation */
	async function create_generators(count: number, api_id: BufferSource): Promise<PointG1[]> {
		if (count >= Math.pow(2, 64)) {
			throw new Error(`count too high: ${count} >= 2^64`, { cause: { count } });
		}
		const seed_dst = concat(api_id, sig_generator_seed);
		const generator_dst = concat(api_id, sig_generator_dst);
		const generator_seed = concat(api_id, message_generator_seed);
		let v = await expand_message(generator_seed, seed_dst, expand_len);
		const result = [];
		for (let i = 1; i <= count; ++i) {
			v = await expand_message(concat(v, I2OSP(BigInt(i), 8)), seed_dst, expand_len);
			result.push(hash_to_curve_g1(v, generator_dst));
		}
		return result;
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#secret-key */
	async function KeyGen(key_material: BufferSource, key_info: BufferSource | null, key_dst: BufferSource | null): Promise<bigint> {
		key_material = key_material ?? new Uint8Array([]);
		key_info = key_info ?? new Uint8Array([]);
		const dst = key_dst ?? new TextEncoder().encode(suite.id + "KEYGEN_DST_");

		if (key_material.byteLength < 32) {
			throw new Error(`key_material too short: ${toHex(key_material)}`, { cause: { key_material } });
		}
		if (key_info.byteLength > 65535) {
			throw new Error(`key_info too long: expected length max 65535, got: ${key_info.byteLength}`, { cause: { key_info } });
		}
		const derive_input = concat(key_material, I2OSP(BigInt(key_info.byteLength), 2), key_info);
		const SK = await hash_to_scalar(derive_input, dst);
		return SK;
	}

	function SkToPk(SK: bigint): BufferSource {
		return G2.BASE.multiply(SK).toBytes();
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-serialize */
	function serialize(input_array: (PointG1 | PointG2 | bigint | number)[]): BufferSource {
		return concat(...input_array.map(el => {
			switch (typeof el) {
				case 'number':
					return I2OSP(el, 8);

				case 'bigint':
					return I2OSP(el, octet_scalar_length);

				case 'object':
					return el.toBytes();

				default:
					throw new Error(`Invalid type of value: ${el}`, { cause: { el } });
			}
		}));
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-signature-to-octets */
	function signature_to_octets(A: PointG1, e: bigint): BufferSource {
		return serialize([A, e]);
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#section-4.2.4.3 */
	function octets_to_signature(signature_octets: BufferSource): [PointG1, bigint] {
		const expected_len = octet_point_length + octet_scalar_length;
		if (signature_octets.byteLength !== expected_len) {
			throw new Error(`Invalid length: expected ${expand_len}, got ${signature_octets.byteLength}`, { cause: { signature_octets } });
		}
		const signature_octets_u8 = toU8(signature_octets);
		const A_octets = signature_octets_u8.slice(0, octet_point_length);
		const A = G1.fromBytes(A_octets);
		A.assertValidity();
		if (A.is0()) {
			throw new Error("A must not be the zero (infinity) point", { cause: { signature_octets, A } });
		}

		const e = OS2IP(signature_octets_u8.slice(octet_point_length));
		if (e === 0n || e >= Fr.ORDER) {
			throw new Error("e must be nonzero and less than curve order", { cause: { signature_octets, e } });
		}

		return [A, e];
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-proof-to-octets */
	function proof_to_octets(proof: [PointG1, PointG1, PointG1, bigint, bigint, bigint, bigint[], bigint]) {
		const [Abar, Bbar, D, ehat, r1hat, r3hat, mhatj, challenge] = proof;
		return serialize([Abar, Bbar, D, ehat, r1hat, r3hat, ...mhatj, challenge]);
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-octets-to-proof */
	function octets_to_proof(proof_octets: BufferSource): [PointG1, PointG1, PointG1, bigint, bigint, bigint, bigint[], bigint] {
		const proof_len_floor = 3 * octet_point_length + 4 * octet_scalar_length;
		if (proof_octets.byteLength < proof_len_floor) {
			throw new Error(`Proof too short: expected at least ${proof_len_floor} octets, was ${proof_octets.byteLength}`, { cause: { proof_octets, proof_len_floor } });
		}

		const proof_octets_u8 = toU8(proof_octets);

		const Ai = [0, 1, 2].map(i => {
			const index = i * octet_point_length;
			const end_index = index + octet_point_length;
			const Ai = octets_to_point_E1(proof_octets_u8.slice(index, end_index));
			if (Ai.is0()) {
				throw new Error("Proof point must not be the identity point", { cause: { index, proof_octets } });
			}
			subgroup_check_G1(Ai);
			return Ai;
		});

		const scalar_octets = proof_octets_u8.slice(octet_point_length * 3);
		const sj = new Array(scalar_octets.length / octet_scalar_length).fill(0).map((_, j) => {
			const index = j * octet_scalar_length;
			const end_index = index + octet_scalar_length;
			const sj = OS2IP(scalar_octets.slice(index, end_index));
			if (sj === 0n || sj >= Fr.ORDER) {
				throw new Error(`Scalar out of range: ${sj}`, { cause: { r: Fr.ORDER, sj } });
			}
			return sj;
		});

		if (scalar_octets.length !== sj.length * octet_scalar_length) {
			throw new Error("Trailing proof octets", { cause: { proof_octets, octet_point_length, octet_scalar_length } });
		}
		const msg_commitments = (
			sj.length > 4
				? sj.slice(3, sj.length - 1)
				: []
		);
		return [Ai[0], Ai[1], Ai[2], sj[0], sj[1], sj[2], msg_commitments, sj[sj.length - 1]];
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-notation */
	function octets_to_point_E1(ostr: BufferSource): PointG1 {
		return G1.fromBytes(toU8(ostr));
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-notation */
	function subgroup_check_G1(P: PointG1): void {
		P.assertValidity();
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-notation */
	function octets_to_point_E2(ostr: BufferSource): PointG2 {
		return G2.fromBytes(toU8(ostr));
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-notation */
	function subgroup_check_G2(Q: PointG2): void {
		Q.assertValidity();
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-octets-to-public-key */
	function octets_to_pubkey(PK: BufferSource): PointG2 {
		const W = octets_to_point_E2(PK);
		subgroup_check_G2(W);
		if (W.is0()) {
			throw new Error("Public key must not be the zero (infinity) point", { cause: { PK } });
		}
		return W;
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-signature-generation-sign */
	async function Sign(
		SK: bigint,
		PK: BufferSource,
		header: BufferSource | null,
		messages: BufferSource[] | null,
	): Promise<BufferSource> {
		header = header ?? new Uint8Array([]);
		messages = messages ?? [];
		const message_scalars = await messages_to_scalars(messages, api_id);
		const generators = await create_generators(messages.length + 1, api_id);
		const signature = await CoreSign(SK, PK, generators, header, message_scalars, api_id);
		return signature;
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-signature-verification-veri */
	async function Verify(
		PK: BufferSource,
		signature: BufferSource,
		header: BufferSource | null,
		messages: BufferSource[] | null,
	): Promise<true> {
		header = header ?? new Uint8Array([]);
		messages = messages ?? [];
		const message_scalars = await messages_to_scalars(messages, api_id);
		const generators = await create_generators(messages.length + 1, api_id);
		const result = await CoreVerify(PK, signature, generators, header, message_scalars, api_id);
		return result;
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-proof-generation-proofgen */
	async function ProofGen(
		PK: BufferSource,
		signature: BufferSource,
		header: BufferSource | null,
		ph: BufferSource | null,
		messages: BufferSource[] | null,
		disclosed_indexes: number[] | null,
	): Promise<BufferSource> {
		header = header ?? new Uint8Array([]);
		ph = ph ?? new Uint8Array([]);
		messages = messages ?? [];
		disclosed_indexes = disclosed_indexes ?? [];
		const message_scalars = await messages_to_scalars(messages, api_id);
		const generators = await create_generators(messages.length + 1, api_id);
		const proof = await CoreProofGen(PK, signature, generators, header, ph, message_scalars, disclosed_indexes, api_id);
		return proof;
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-proof-verification-proofver */
	async function ProofVerify(
		PK: BufferSource,
		proof: BufferSource,
		header: BufferSource | null,
		ph: BufferSource | null,
		disclosed_messages: BufferSource[] | null,
		disclosed_indexes: number[] | null,
	): Promise<true> {
		header = header ?? new Uint8Array([]);
		ph = ph ?? new Uint8Array([]);
		disclosed_messages = disclosed_messages ?? [];
		disclosed_indexes = disclosed_indexes ?? [];

		const proof_len_floor = 3 * octet_point_length + 4 * octet_scalar_length;
		if (proof.byteLength < proof_len_floor) {
			throw new Error(`Proof too short: expected at least ${proof_len_floor} octets, was ${proof.byteLength}`, { cause: { proof, proof_len_floor } });
		}
		const U = Math.floor((proof.byteLength - proof_len_floor) / octet_scalar_length);
		const R = disclosed_indexes.length;

		const message_scalars = await messages_to_scalars(disclosed_messages, api_id);
		const generators = await create_generators(U + R + 1, api_id);
		const result = await CoreProofVerify(PK, proof, generators, header, ph, message_scalars, disclosed_indexes, api_id);
		return result;
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-coresign */
	async function CoreSign(
		SK: bigint,
		PK: BufferSource,
		generators: PointG1[],
		header: BufferSource,
		messages: bigint[],
		api_id: BufferSource,
	): Promise<BufferSource> {
		const hash_to_scalar_dst = concat(api_id, new TextEncoder().encode("H2S_"));

		const L = messages.length;
		if (generators.length !== L + 1) {
			throw new Error("Messages and generators not of matching lengths", { cause: { messages, generators } });
		}
		const Q_1 = generators[0];
		const H_Points = generators.slice(1);

		const domain = await calculate_domain(PK, Q_1, H_Points, header, api_id);
		const e = await hash_to_scalar(serialize([SK, ...messages, domain]), hash_to_scalar_dst);
		const B = P1.add(Q_1.multiply(domain)).add(sumprod(H_Points, messages));
		const A = B.multiply(Fr.inv(SK + e));
		return signature_to_octets(A, e);
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-coreverify */
	async function CoreVerify(
		PK: BufferSource,
		signature: BufferSource,
		generators: PointG1[],
		header: BufferSource,
		messages: bigint[],
		api_id: BufferSource,
	): Promise<true> {
		const [A, e] = octets_to_signature(signature);
		const W = octets_to_pubkey(PK);
		const L = messages.length;
		if (generators.length !== L + 1) {
			throw new Error("Messages and generators not of matching lengths", { cause: { messages, generators } });
		}
		const Q_1 = generators[0];
		const H_Points = generators.slice(1);

		const domain = await calculate_domain(PK, Q_1, H_Points, header, api_id);
		const B = P1.add(Q_1.multiply(domain)).add(sumprod(H_Points, messages));
		if (!Fp12.eql(
			Fp12.mul(h(A, W.add(G2.BASE.multiply(e))), h(B, G2.BASE.negate())),
			Fp12.ONE,
		)) {
			throw new Error("Invalid signature", { cause: { PK, signature, header, messages } });
		}
		return true;
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-coreproofgen */
	async function CoreProofGen(
		PK: BufferSource,
		signature: BufferSource,
		generators: PointG1[],
		header: BufferSource,
		ph: BufferSource,
		messages: bigint[],
		disclosed_indexes: number[],
		api_id: BufferSource,
	): Promise<BufferSource> {
		const signature_result = octets_to_signature(signature);
		const [A, e] = signature_result;
		const L = messages.length;
		const R = disclosed_indexes.length;
		if (R > L) {
			throw new Error("Too many disclosed indexes", { cause: { messages, disclosed_indexes } });
		}
		const U = L - R;
		for (let i of disclosed_indexes) {
			if (i < 0 || i > L - 1) {
				throw new Error(`Invalid disclosed index: ${i}`, { cause: { messages, disclosed_indexes, i } });
			}
		}
		const disclosed_set = new Set(disclosed_indexes);
		const undisclosed_indexes = messages.map((msg, i) => i).filter(i => !disclosed_set.has(i));
		const disclosed_messages = disclosed_indexes.map(i => messages[i]);
		const undisclosed_messages = undisclosed_indexes.map(i => messages[i]);

		const random_scalars = await calculate_random_scalars(5 + U);
		const init_res = await ProofInit(PK, signature_result, generators, random_scalars, header, messages, undisclosed_indexes, api_id);
		const challenge = await ProofChallengeCalculate(init_res, disclosed_messages, disclosed_indexes, ph, api_id);
		const proof = ProofFinalize(init_res, challenge, e, random_scalars, undisclosed_messages);
		return proof;
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-coreproofverify */
	async function CoreProofVerify(
		PK: BufferSource,
		proof: BufferSource,
		generators: PointG1[],
		header: BufferSource,
		ph: BufferSource,
		disclosed_messages: bigint[],
		disclosed_indexes: number[],
		api_id: BufferSource,
	): Promise<true> {
		const proof_result = octets_to_proof(proof);
		const [Abar, Bbar, D, ehat, r1hat, r3hat, commitments, cp] = proof_result;
		const W = octets_to_pubkey(PK);

		const init_res = await ProofVerifyInit(PK, proof_result, generators, header, disclosed_messages, disclosed_indexes, api_id);
		const challenge = await ProofChallengeCalculate(init_res, disclosed_messages, disclosed_indexes, ph, api_id);
		if (cp !== challenge) {
			throw new Error(`Invalid proof: incorrect challenge: expected ${challenge}, was ${cp}`, { cause: { proof } })
		}
		if (!Fp12.eql(
			Fp12.mul(h(Abar, W), h(Bbar, G2.BASE.negate())),
			Fp12.ONE,
		)) {
			throw new Error("Invalid proof: incorrect pairing", { cause: { proof } })
		}
		return true;
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-proof-initialization */
	async function ProofInit(
		PK: BufferSource,
		signature: [PointG1, bigint],
		generators: PointG1[],
		random_scalars: bigint[],
		header: BufferSource,
		messages: bigint[],
		undisclosed_indexes: number[],
		api_id: BufferSource,
	): Promise<[PointG1, PointG1, PointG1, PointG1, PointG1, bigint]> {
		const [A, e] = signature;
		const L = messages.length;
		const U = undisclosed_indexes.length;
		if (random_scalars.length !== U + 5) {
			throw new Error(`Wrong number of random scalars: expected ${U + 5}, got ${random_scalars.length}`, { cause: { random_scalars, undisclosed_indexes } });
		}
		const [r1, r2, etil, r1til, r3til] = random_scalars.slice(0, 5);
		const mtilj = random_scalars.slice(5);

		if (generators.length !== L + 1) {
			throw new Error(`Wrong number of generators: expected ${L + 1}, got ${generators.length}`, { cause: { generators, messages } });
		}
		const Q1 = generators[0];
		const MsgGenerators = generators.slice(1);
		const Hi = MsgGenerators;
		const Hj = undisclosed_indexes.map(j => MsgGenerators[j]);

		for (let i of undisclosed_indexes) {
			if (i < 0 || i > L - 1) {
				throw new Error(`Invalid undisclosed index: ${i}`, { cause: { messages, undisclosed_indexes, i } });
			}
		}
		if (U > L) {
			throw new Error("Invalid number of undisclosed indexes", { cause: { messages, undisclosed_indexes, L, U } });
		}
		const domain = await calculate_domain(PK, Q1, Hi, header, api_id);
		const B = P1.add(Q1.multiply(domain)).add(sumprod(Hi, messages));
		const D = B.multiply(r2);
		const Abar = A.multiply(Fr.mul(r1, r2));
		const Bbar = D.multiply(r1).subtract(Abar.multiply(e));

		const T1 = Abar.multiply(etil).add(D.multiply(r1til));
		const T2 = D.multiply(r3til).add(sumprod(Hj, mtilj));
		return [Abar, Bbar, D, T1, T2, domain];
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-proof-finalization */
	function ProofFinalize(
		init_res: [PointG1, PointG1, PointG1, PointG1, PointG1, bigint],
		challenge: bigint,
		e_value: bigint,
		random_scalars: bigint[],
		undisclosed_messages: bigint[],
	): BufferSource {
		const U = undisclosed_messages.length;
		if (random_scalars.length !== U + 5) {
			throw new Error(`Wrong number of random scalars: expected ${U + 5}, got ${random_scalars.length}`, { cause: { random_scalars, undisclosed_messages } });
		}
		const [r1, r2, etil, r1til, r3til] = random_scalars.slice(0, 5);
		const mtilj = random_scalars.slice(5);
		const [Abar, Bbar, D] = init_res;

		const r3 = Fr.inv(r2);
		const ehat = Fr.add(etil, Fr.mul(e_value, challenge));
		const r1hat = Fr.sub(r1til, Fr.mul(r1, challenge));
		const r3hat = Fr.sub(r3til, Fr.mul(r3, challenge));
		const mhatj = mtilj.map((mtilj, j) => Fr.add(mtilj, Fr.mul(undisclosed_messages[j], challenge)));
		const proof: [PointG1, PointG1, PointG1, bigint, bigint, bigint, bigint[], bigint] = [Abar, Bbar, D, ehat, r1hat, r3hat, mhatj, challenge];
		return proof_to_octets(proof);
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-proof-verification-initiali */
	async function ProofVerifyInit(
		PK: BufferSource,
		proof: [PointG1, PointG1, PointG1, bigint, bigint, bigint, bigint[], bigint],
		generators: PointG1[],
		header: BufferSource,
		disclosed_messages: bigint[],
		disclosed_indexes: number[],
		api_id: BufferSource,
	): Promise<[PointG1, PointG1, PointG1, PointG1, PointG1, bigint]> {
		const [Abar, Bbar, D, ehat, r1hat, r3hat, commitments, c] = proof;
		const U = commitments.length;
		const R = disclosed_indexes.length;
		const L = R + U;
		for (let i of disclosed_indexes) {
			if (i < 0 || i > L - 1) {
				throw new Error(`Invalid disclosed index: ${i}`, { cause: { disclosed_indexes, i } });
			}
		}
		const disclosed_indexes_set = new Set(disclosed_indexes);
		const undisclosed_indexes = [...commitments, ...disclosed_messages].map((_, j) => j).filter(j => !disclosed_indexes_set.has(j));
		if (disclosed_messages.length !== R) {
			throw new Error("Disclosed messages and indexes not of matching lengths", { cause: { disclosed_messages, disclosed_indexes } });
		}

		if (generators.length !== L + 1) {
			throw new Error("Messages and generators not of matching lengths", { cause: { proof, generators } });
		}
		const Q1 = generators[0];
		const MsgGenerators = generators.slice(1);
		const H_Points = MsgGenerators;
		const Hi_Points = disclosed_indexes.map(i => MsgGenerators[i]);
		const Hj_Points = undisclosed_indexes.map(j => MsgGenerators[j]);

		const domain = await calculate_domain(PK, Q1, H_Points, header, api_id);

		const T1 = Bbar.multiply(c).add(Abar.multiply(ehat)).add(D.multiply(r1hat));
		const Bv = P1.add(Q1.multiply(domain)).add(sumprod(Hi_Points, disclosed_messages));
		const T2 = Bv.multiply(c).add(D.multiply(r3hat)).add(sumprod(Hj_Points, commitments));

		return [Abar, Bbar, D, T1, T2, domain];
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-challenge-calculation */
	async function ProofChallengeCalculate(
		init_res: [PointG1, PointG1, PointG1, PointG1, PointG1, bigint],
		disclosed_messages: bigint[],
		disclosed_indexes: number[],
		ph: BufferSource,
		api_id: BufferSource,
	): Promise<bigint> {
		const hash_to_scalar_dst = concat(api_id, new TextEncoder().encode("H2S_"));

		const R = disclosed_indexes.length;
		if (disclosed_messages.length !== R) {
			throw new Error("Disclosed messages and indexes not of matching lengths", { cause: { disclosed_messages, disclosed_indexes } });
		}
		const [Abar, Bbar, D, T1, T2, domain] = init_res;

		if (R > Math.pow(2, 64) - 1) {
			throw new Error("Too many disclosed indexes", { cause: { disclosed_indexes } });
		}
		if (ph.byteLength > Math.pow(2, 64) - 1) {
			throw new Error("Presentation header too long", { cause: { ph } });
		}

		const i_msg = disclosed_indexes.map((i, j) => [i, disclosed_messages[j]]).flat(1);
		const c_arr = [R, ...i_msg, Abar, Bbar, D, T1, T2, domain];
		const c_octs = concat(serialize(c_arr), I2OSP(ph.byteLength, 8), ph);
		return await hash_to_scalar(c_octs, hash_to_scalar_dst);
	}

	return {
		params: suite,
		api_id,
		hash_to_scalar,
		messages_to_scalars,
		create_generators,
		KeyGen,
		SkToPk,
		Sign,
		Verify,
		ProofGen,
		ProofVerify,
	};
}

type PointG1 = ProjPointType<bigint>;
type PointG2 = ProjPointType<Fp2>;
type HashToScalarFunc = (msg_octets: BufferSource, dst: BufferSource) => Promise<bigint>;
type MessagesToScalarsFunc = (messages: BufferSource[], api_id: BufferSource) => Promise<bigint[]>;
type CreateGeneratorsFunc = (count: number, api_id: BufferSource) => Promise<PointG1[]>;
type KeyGenFunction = (key_material: BufferSource, key_info: BufferSource | null, key_dst: BufferSource | null) => Promise<bigint>;
type SkToPkFunction = (SK: bigint) => BufferSource;
type PairingFunction = (P: PointG1, Q: PointG2) => Fp12;
type SignFunction = (SK: bigint, PK: BufferSource, header: BufferSource | null, messages: BufferSource[] | null) => Promise<BufferSource>;
type VerifyFunction = (PK: BufferSource, signature: BufferSource, header: BufferSource | null, messages: BufferSource[] | null) => Promise<true>;
type ProofGenFunction = (PK: BufferSource, signature: BufferSource, header: BufferSource | null, ph: BufferSource | null, messages: BufferSource[] | null, disclosed_indexes: number[] | null,) => Promise<BufferSource>;
type ProofVerifyFunction = (PK: BufferSource, proof: BufferSource, header: BufferSource | null, ph: BufferSource | null, disclosed_messages: BufferSource[] | null, disclosed_indexes: number[] | null,) => Promise<true>;


export type SuiteId = 'BBS_BLS12381G1_XMD:SHA-256_SSWU_RO_';

type CreateGeneratorsDsts = {
	sig_generator_seed: BufferSource,
	sig_generator_dst: BufferSource,
	message_generator_seed: BufferSource,
};

type SuiteParams = {
	id: SuiteId,
	octet_scalar_length: number,
	octet_point_length: number,
	hash_to_curve_suite: HashToCurveSuite,
	hash_to_curve_g1: (msg: BufferSource, DST: BufferSource) => PointG1,
	expand_len: number,
	Fr: IField<bigint>,
	Fp12: Fp12Bls,
	G1: ProjConstructor<bigint>,
	G2: ProjConstructor<Fp2>,
	P1: PointG1,
	h: PairingFunction,
	create_generators_dsts?: CreateGeneratorsDsts,
	mocked_random_scalars_params?: { SEED: BufferSource, DST: BufferSource },
}

type CipherSuite = {
	params: SuiteParams,
	api_id: BufferSource,
	hash_to_scalar: HashToScalarFunc,
	messages_to_scalars: MessagesToScalarsFunc,
	create_generators: CreateGeneratorsFunc,
	KeyGen: KeyGenFunction,
	SkToPk: SkToPkFunction,
	Sign: SignFunction,
	Verify: VerifyFunction,
	ProofGen: ProofGenFunction,
	ProofVerify: ProofVerifyFunction,
}


export function getCipherSuite(
	suiteId: SuiteId,
	DST: BufferSource,
	overrides?: {
		mocked_random_scalars_params?: { SEED: BufferSource, DST: BufferSource },
		create_generators_dsts?: CreateGeneratorsDsts,
	},
): CipherSuite {

	switch (suiteId) {
		case 'BBS_BLS12381G1_XMD:SHA-256_SSWU_RO_':
			// https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-bls12-381-sha-256
			return createSuite({
				id: 'BBS_BLS12381G1_XMD:SHA-256_SSWU_RO_',
				octet_scalar_length: 32,
				octet_point_length: 48,
				hash_to_curve_suite: hashToCurve('BLS12381G1_XMD:SHA-256_SSWU_RO_', DST),
				hash_to_curve_g1: (msg: BufferSource, DST: BufferSource) =>
					(bls12_381.G1.hashToCurve(toU8(msg), { DST: toU8(DST) }) as PointG1),
				expand_len: 48,
				Fr: bls12_381.fields.Fr,
				Fp12: bls12_381.fields.Fp12,
				G1: bls12_381.curves.G1,
				G2: bls12_381.curves.G2,
				P1: bls12_381.curves.G1.fromBytes(toU8(fromHex("a8ce256102840821a3e94ea9025e4662b205762f9776b3a766c872b948f1fd225e7c59698588e70d11406d161b4e28c9"))),
				h: bls12_381.pairing,
				create_generators_dsts: overrides?.create_generators_dsts,
				mocked_random_scalars_params: overrides?.mocked_random_scalars_params,
			});

		default:
			throw new Error(`Unknown suite: ${suiteId}`, { cause: { suiteId } });
	}
}
