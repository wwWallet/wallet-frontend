/// Implementation of the hash_to_field function of RFC 9380
/// https://www.rfc-editor.org/rfc/rfc9380#name-hash_to_field-implementatio


function toU8(b: BufferSource): Uint8Array {
	if (b instanceof Uint8Array) {
		return b;
	} else if (b instanceof ArrayBuffer) {
		return new Uint8Array(b);
	} else {
		return new Uint8Array(b.buffer);
	}
}

function concat(...b: BufferSource[]): ArrayBuffer {
	return b.map(toU8).reduce((a, b) => new Uint8Array([...a, ...b]), new Uint8Array([])).buffer;
}

function strxor(a: BufferSource, b: BufferSource): ArrayBuffer {
	const ua = toU8(a);
	const ub = toU8(b);
	if (ua.length !== ub.length) {
		throw new Error(`Different lengths in xor: ${ua.length} != ${ub.length}`);
	}
	return new Uint8Array(ua.length).map((_, i: number) => ua[i] ^ ub[i]);
}

function OS2IP(binary: BufferSource): bigint {
	return toU8(binary).reduce(
		(result: bigint, b: number) => (result << 8n) + BigInt(b),
		0n,
	);
}

function I2OSP(a: bigint, length: number): ArrayBuffer {
	return new Uint8Array(length).map(
		(_, i: number): number =>
			Number(BigInt.asUintN(8, a >> (BigInt(length - 1 - i) * 8n)))
	).buffer;
}

type HashFunction = (msg: BufferSource) => Promise<ArrayBuffer>;
const sha256: HashFunction = (msg: BufferSource) => crypto.subtle.digest('SHA-256', msg);
const sha512: HashFunction = (msg: BufferSource) => crypto.subtle.digest('SHA-512', msg);

type ExpandMessageFunction = (input: BufferSource, DST: BufferSource, len: number) => Promise<ArrayBuffer>;
type ExpandMessageXmdParams = {
	H: HashFunction,
	b_in_bytes: number,
	s_in_bytes: number,
}

/** @see https://www.rfc-editor.org/rfc/rfc9380#name-expand_message_xmd */
function make_expand_message_xmd({ H, b_in_bytes, s_in_bytes }: ExpandMessageXmdParams): ExpandMessageFunction {
	return async (msg: BufferSource, DST: BufferSource, len_in_bytes: number): Promise<ArrayBuffer> => {
		const ell = Math.ceil(len_in_bytes / b_in_bytes);
		if (ell > 255 || len_in_bytes > 65535 || DST.byteLength > 255) {
			throw new Error(`Requested length too long: ell=${ell}, len_in_bytes=${len_in_bytes}, DST.byteLength=${DST.byteLength}`);
		}
		const DST_prime = concat(DST, I2OSP(BigInt(DST.byteLength), 1));
		const Z_pad = I2OSP(0n, s_in_bytes);
		const l_i_b_str = I2OSP(BigInt(len_in_bytes), 2);
		const msg_prime = concat(Z_pad, msg, l_i_b_str, I2OSP(0n, 1), DST_prime);
		const b: ArrayBuffer[] = new Array(ell + 1);
		b[0] = await H(msg_prime);
		b[1] = await H(concat(b[0], I2OSP(1n, 1), DST_prime));
		for (let i = 2; i <= ell; ++i) {
			b[i] = await H(concat(strxor(b[0], b[i - 1]), I2OSP(BigInt(i), 1), DST_prime));
		}
		const uniform_bytes = concat(...b.slice(1));
		return uniform_bytes.slice(0, 0 + len_in_bytes);
	};
}

export type HashToFieldFunction = (msg: BufferSource, count: number) => Promise<bigint[][]>;

/** @see https://www.rfc-editor.org/rfc/rfc9380#name-hash_to_field-implementatio */
function make_hash_to_field({ DST, p, m, L, expand_message }: HashToFieldParams): HashToFieldFunction {
	if (DST.byteLength == 0) {
		throw new Error("Invalid DST: Tag MUST have nonzero length.", { cause: 'dst_empty' });
	}

	return async (msg: BufferSource, count: number): Promise<bigint[][]> => {
		const len_in_bytes = count * m * L;
		const uniform_bytes = new Uint8Array(await expand_message(msg, DST, len_in_bytes));
		const u: bigint[][] = new Array(count);
		for (let i = 0; i < count; ++i) {
			const e: bigint[] = new Array(m);
			for (let j = 0; j < m; ++j) {
				const elm_offset = L * (j + i * m);
				const tv = uniform_bytes.slice(elm_offset, elm_offset + L);
				e[j] = OS2IP(tv) % p;
			}
			u[i] = e;
		}
		return u;
	};
}

type SuiteParams = {
	/** The characteristic of the curve coordinate field. */
	p: bigint,

	/** The extension degree of the curve coordinate field. */
	m: number,

	/** The order of the prime order subgroup of the curve. */
	prime_subgroup_order: bigint,

	/** ceil((ceil(log2(p)) + k) / 8), where k is the security parameter of the suite (e.g., k = 128). */
	L: number,

	expand_message: ExpandMessageFunction,
}

type HashToFieldParams = SuiteParams & {
	DST: BufferSource,
}

export type SuiteId = (
	'P256_XMD:SHA-256_SSWU_RO_'
	| 'P521_XMD:SHA-512_SSWU_RO_'
)

/** Suites defined in https://www.rfc-editor.org/rfc/rfc9380#name-suites-for-hashing */
const suites: { [suiteId in SuiteId]: SuiteParams } = {
	'P256_XMD:SHA-256_SSWU_RO_': {
		p: BigInt('0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff'),
		m: 1,
		prime_subgroup_order: BigInt('0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551'),
		L: 48,
		expand_message: make_expand_message_xmd({
			H: sha256,
			b_in_bytes: 32,
			s_in_bytes: 64,
		}),
	},

	'P521_XMD:SHA-512_SSWU_RO_': {
		p: BigInt('0x01ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
		m: 1,
		prime_subgroup_order: BigInt('0x01fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffa51868783bf2f966b7fcc0148f709a5d03bb5c9b8899c47aebb6fb71e91386409'),
		L: 98,
		expand_message: make_expand_message_xmd({
			H: sha512,
			b_in_bytes: 64,
			s_in_bytes: 128,
		}),
	},
};


export type HashToCurveFunctions = {
	suiteId: SuiteId,

	/**
	A function hashing to the coordinate field of the curve.

	This is the `hash_to_field` function defined in the RFC 9380 suite,
	where the parameter `p` is set to the characteristic of the coordinate field.

	@see https://www.rfc-editor.org/rfc/rfc9380#name-hashing-to-a-finite-field
	@see https://www.rfc-editor.org/rfc/rfc9380#name-suites-for-hashing
	*/
	hashToCoordinateField: HashToFieldFunction,

	/**
	A function hashing to the scalar field (i.e., the private key space) of the curve.

	This is the `hash_to_field` function defined in the RFC 9380 suite, but
	instantiated with the parameter `p` set to the order of the prime order
	subgroup of the curve instead of the characteristic of the coordinate field.

	@see https://www.rfc-editor.org/rfc/rfc9380#name-hashing-to-a-finite-field
	@see https://www.rfc-editor.org/rfc/rfc9380#name-suites-for-hashing
	*/
	hashToScalarField: HashToFieldFunction,
}

/**
	Get a suite of functions defined by the identified RFC 9380 suite,
	instantiated with the given DST.

	@see https://www.rfc-editor.org/rfc/rfc9380#name-hashing-to-a-finite-field
	@see https://www.rfc-editor.org/rfc/rfc9380#name-suites-for-hashing
*/
export function hashToCurve(suiteId: SuiteId, DST: BufferSource): HashToCurveFunctions {
	return {
		suiteId,
		hashToCoordinateField: make_hash_to_field({ ...suites[suiteId], DST }),
		hashToScalarField: make_hash_to_field({
			...suites[suiteId],
			p: suites[suiteId].prime_subgroup_order,
			DST,
		}),
	};
}
