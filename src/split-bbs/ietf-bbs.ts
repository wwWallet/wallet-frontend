/** Implementation of https://datatracker.ietf.org/doc/draft-irtf-cfrg-bbs-signatures/08/ */

import { concat, I2OSP, OS2IP, toHex, toU8 } from "../util";
import { hashToCurve, HashToCurveSuite } from "../arkg/hash_to_curve";
import { PointG1 } from ".";


/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-hash-to-scalar */
export function make_hash_to_scalar(
	suite: CipherSuite,
): (msg_octets: BufferSource, dst: BufferSource) => Promise<bigint> {
	const { expand_message, prime_subgroup_order } = suite.hash_to_curve_suite.suiteParams;
	return async (msg_octets: BufferSource, dst: BufferSource): Promise<bigint> => {
		const uniform_bytes = await expand_message(msg_octets, dst, suite.expand_len);
		return OS2IP(uniform_bytes) % prime_subgroup_order;
	};
}

/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#messages-to-scalars */
export function messages_to_scalars(
	messages: BufferSource[],
	api_id: BufferSource | null,
	suite: CipherSuite,
): Promise<bigint[]> {
	if (messages.length >= Math.pow(2, 64)) {
		throw new Error(`Too many messages: ${messages.length} >= 2^64`, { cause: { length: messages.length } });
	}
	const map_msg_to_scalar_as_hash = new TextEncoder().encode("MAP_MSG_TO_SCALAR_AS_HASH_");
	const hash_to_scalar = make_hash_to_scalar(suite);
	api_id = api_id ?? new Uint8Array([]);
	const map_dst = concat(api_id, map_msg_to_scalar_as_hash);

	return Promise.all(messages.map(message => hash_to_scalar(message, map_dst)));
}

type CreateGeneratorsParams = {
	hash_to_curve_g1: (msg: BufferSource, DST: BufferSource) => PointG1,
	expand_message: (seed: BufferSource, DST: BufferSource, expand_len: number) => Promise<ArrayBuffer>,
	expand_len: number,
}

/** https://www.ietf.org/archive/id/draft-irtf-cfrg-bbs-signatures-08.html#name-generators-calculation */
export function make_create_generators(
	{
		hash_to_curve_g1,
		expand_message,
		expand_len,
	}: CreateGeneratorsParams,
	{
		sig_generator_seed,
		sig_generator_dst,
		message_generator_seed,
	}: {
		sig_generator_seed: BufferSource,
		sig_generator_dst: BufferSource,
		message_generator_seed: BufferSource,
	} = {
			sig_generator_seed: new TextEncoder().encode("SIG_GENERATOR_SEED_"),
			sig_generator_dst: new TextEncoder().encode("SIG_GENERATOR_DST_"),
			message_generator_seed: new TextEncoder().encode("MESSAGE_GENERATOR_SEED"),
		},
): (count: number, api_id: BufferSource | null) => Promise<PointG1[]> {
	return async (count: number, api_id: BufferSource | null): Promise<PointG1[]> => {
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
	};
}

export function makeKeyGen(suite: CipherSuite): (key_material: BufferSource, key_info: BufferSource | null, key_dst: BufferSource | null) => Promise<bigint> {
	const hash_to_scalar = make_hash_to_scalar(suite);
	return async (key_material: BufferSource, key_info: BufferSource | null, key_dst: BufferSource | null): Promise<bigint> => {
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
	};
}


export type SuiteId = 'BBS_BLS12381G1_XMD:SHA-256_SSWU_RO_';

type CipherSuite = {
	id: SuiteId,
	hash_to_curve_suite: HashToCurveSuite,
	expand_len: number,
}

export function getCipherSuite(suiteId: SuiteId, DST: BufferSource): CipherSuite {
	switch (suiteId) {
		case 'BBS_BLS12381G1_XMD:SHA-256_SSWU_RO_':
			return {
				id: 'BBS_BLS12381G1_XMD:SHA-256_SSWU_RO_',
				hash_to_curve_suite: hashToCurve('BLS12381G1_XMD:SHA-256_SSWU_RO_', DST),
				expand_len: 48,
			};

		default:
			throw new Error(`Unknown suite: ${suiteId}`, { cause: { suiteId } });
	}
}
