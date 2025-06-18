/** Implementation of https://datatracker.ietf.org/doc/draft-irtf-cfrg-bbs-signatures/08/ */

import { ProjPointType } from "@noble/curves/abstract/weierstrass";
import { Fp12, Fp2 } from "@noble/curves/abstract/tower";
import { bls12_381 } from "@noble/curves/bls12-381";

import { concat, fromHex, I2OSP, OS2IP, toHex, toU8 } from "../util";
import { hashToCurve, HashToCurveSuite } from "../arkg/hash_to_curve";


function createSuite(suite: SuiteParams): CipherSuite {
	const { expand_len, hash_to_curve_g1 } = suite;
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
		const ikm = toU8(key_material);
		const info = key_info ? toU8(key_info) : new Uint8Array([]);
		const dst = key_dst = key_dst ? toU8(key_dst) : new TextEncoder().encode(suite.id + "KEYGEN_DST_");

		if (ikm.length < 32) {
			throw new Error(`key_material too short: ${toHex(key_material)}`, { cause: { key_material } });
		}
		if (info.length > 65535) {
			throw new Error(`key_info too long: expected length max 65535, got: ${info.length}`, { cause: { key_info } });
		}
		const derive_input = concat(ikm, I2OSP(BigInt(info.length), 2), info);
		const SK = await hash_to_scalar(derive_input, dst);
		return SK;
	}

	return {
		params: suite,
		api_id,
		hash_to_scalar,
		messages_to_scalars,
		create_generators,
		KeyGen,
	};
}

type PointG1 = ProjPointType<bigint>;
type PointG2 = ProjPointType<Fp2>;
type HashToScalarFunc = (msg_octets: BufferSource, dst: BufferSource) => Promise<bigint>;
type MessagesToScalarsFunc = (messages: BufferSource[], api_id: BufferSource | null) => Promise<bigint[]>;
type CreateGeneratorsFunc = (count: number, api_id: BufferSource | null) => Promise<PointG1[]>;
type KeyGenFunction = (key_material: BufferSource, key_info: BufferSource | null, key_dst: BufferSource | null) => Promise<bigint>;
type PairingFunction = (P: PointG1, Q: PointG2) => Fp12;


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
				P1: bls12_381.curves.G1.fromBytes(toU8(fromHex("a8ce256102840821a3e94ea9025e4662b205762f9776b3a766c872b948f1fd225e7c59698588e70d11406d161b4e28c9"))),
				h: bls12_381.pairing,
				create_generators_dsts,
			});

		default:
			throw new Error(`Unknown suite: ${suiteId}`, { cause: { suiteId } });
	}
}
