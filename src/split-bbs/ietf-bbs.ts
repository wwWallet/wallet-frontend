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

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-hash-to-scalar */
	async function hash_to_scalar(msg_octets: BufferSource, dst: BufferSource): Promise<bigint> {
		const uniform_bytes = await expand_message(msg_octets, dst, suite.expand_len);
		return OS2IP(uniform_bytes) % prime_subgroup_order;
	};

	async function calculate_domain(
		PK: BufferSource,
		Q_1: PointG1,
		H_Points: PointG1[],
		header: BufferSource | null,
		api_id: BufferSource | null,
	): Promise<bigint> {
		header = header ?? new Uint8Array([]);
		api_id = api_id ?? new Uint8Array([]);
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

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#messages-to-scalars */
	function messages_to_scalars(
		messages: BufferSource[],
		api_id: BufferSource | null,
	): Promise<bigint[]> {
		if (messages.length >= Math.pow(2, 64)) {
			throw new Error(`Too many messages: ${messages.length} >= 2^64`, { cause: { length: messages.length } });
		}
		const map_msg_to_scalar_as_hash = new TextEncoder().encode("MAP_MSG_TO_SCALAR_AS_HASH_");
		api_id = api_id ?? new Uint8Array([]);
		const map_dst = concat(api_id, map_msg_to_scalar_as_hash);

		return Promise.all(messages.map(message => hash_to_scalar(message, map_dst)));
	}

	/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-generators-calculation */
	async function create_generators(count: number, api_id: BufferSource | null): Promise<PointG1[]> {
		if (count >= Math.pow(2, 64)) {
			throw new Error(`count too high: ${count} >= 2^64`, { cause: { count } });
		}
		api_id = api_id ?? new Uint8Array([]);
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
		const dst = key_dst = key_dst ?? new TextEncoder().encode(suite.id + "KEYGEN_DST_");

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

	function signature_to_octets(A: PointG1, e: bigint): BufferSource {
		return serialize([A, e]);
	}

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

	function octets_to_pubkey(PK: BufferSource): PointG2 {
		const W = G2.fromBytes(toU8(PK));
		W.assertValidity();
		if (W.is0()) {
			throw new Error("Public key must not be the zero (infinity) point", { cause: { PK } });
		}
		return W;
	}

	async function CoreSign(
		SK: bigint,
		PK: BufferSource,
		generators: PointG1[],
		header: BufferSource | null,
		messages: bigint[] | null,
		api_id: BufferSource | null,
	): Promise<BufferSource> {
		header = header ?? new Uint8Array([]);
		messages = messages ?? [];
		api_id = api_id ?? new Uint8Array([]);
		const hash_to_scalar_dst = concat(api_id, new TextEncoder().encode("H2S_"));

		const L = messages.length;
		if (generators.length !== L + 1) {
			throw new Error("Messages and generators not of matching lengths", { cause: { messages, generators } });
		}
		const Q_1 = generators[0];
		const H_Points = generators.slice(1);

		const domain = await calculate_domain(PK, Q_1, H_Points, header, api_id);
		const e = await hash_to_scalar(serialize([SK, ...messages, domain]), hash_to_scalar_dst);
		const B = P1.add(Q_1.multiply(domain)).add(
			H_Points.reduce(
				(sum, H_i, i) => sum.add(H_i.multiply(messages[i])),
				G1.ZERO,
			)
		);
		const A = B.multiply(Fr.inv(SK + e));
		return signature_to_octets(A, e);
	}

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

	async function CoreVerify(
		PK: BufferSource,
		signature: BufferSource,
		generators: PointG1[],
		header: BufferSource | null,
		messages: bigint[] | null,
		api_id: BufferSource | null,
	): Promise<true> {
		header = header ?? new Uint8Array([]);
		messages = messages ?? [];
		api_id = api_id ?? new Uint8Array([]);
		const [A, e] = octets_to_signature(signature);
		const W = octets_to_pubkey(PK);
		const L = messages.length;
		if (generators.length !== L + 1) {
			throw new Error("Messages and generators not of matching lengths", { cause: { messages, generators } });
		}
		const Q_1 = generators[0];
		const H_Points = generators.slice(1);

		const domain = await calculate_domain(PK, Q_1, H_Points, header, api_id);
		const B = P1.add(Q_1.multiply(domain)).add(
			H_Points.reduce(
				(sum, H_i, i) => sum.add(H_i.multiply(messages[i])),
				G1.ZERO,
			),
		);
		if (!Fp12.eql(
			Fp12.mul(h(A, W.add(G2.BASE.multiply(e))), h(B, G2.BASE.negate())),
			Fp12.ONE,
		)) {
			throw new Error("Invalid signature", { cause: { PK, signature, header, messages } });
		}
		return true;
	}

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

	return {
		params: suite,
		api_id,
		hash_to_scalar,
		messages_to_scalars,
		create_generators,
		KeyGen,
		Sign,
		Verify,
	};
}

type PointG1 = ProjPointType<bigint>;
type PointG2 = ProjPointType<Fp2>;
type HashToScalarFunc = (msg_octets: BufferSource, dst: BufferSource) => Promise<bigint>;
type MessagesToScalarsFunc = (messages: BufferSource[], api_id: BufferSource | null) => Promise<bigint[]>;
type CreateGeneratorsFunc = (count: number, api_id: BufferSource | null) => Promise<PointG1[]>;
type KeyGenFunction = (key_material: BufferSource, key_info: BufferSource | null, key_dst: BufferSource | null) => Promise<bigint>;
type PairingFunction = (P: PointG1, Q: PointG2) => Fp12;
type SignFunction = (SK: bigint, PK: BufferSource, header: BufferSource | null, messages: BufferSource[] | null) => Promise<BufferSource>;
type VerifyFunction = (PK: BufferSource, signature: BufferSource, header: BufferSource | null, messages: BufferSource[] | null) => Promise<true>;


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
}

type CipherSuite = {
	params: SuiteParams,
	api_id: BufferSource,
	hash_to_scalar: HashToScalarFunc,
	messages_to_scalars: MessagesToScalarsFunc,
	create_generators: CreateGeneratorsFunc,
	KeyGen: KeyGenFunction,
	Sign: SignFunction,
	Verify: VerifyFunction,
}


export function getCipherSuite(suiteId: SuiteId, DST: BufferSource, create_generators_dsts?: CreateGeneratorsDsts): CipherSuite {
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
				create_generators_dsts,
			});

		default:
			throw new Error(`Unknown suite: ${suiteId}`, { cause: { suiteId } });
	}
}
