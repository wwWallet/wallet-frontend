export type Curve = {
	a: bigint,
	b: bigint,
	modulus: bigint,
	order: bigint,
	generator: NonzeroPoint,
};

export type NonzeroPoint = { x: bigint, y: bigint };
export type ZeroPoint = "zero";
export type Point = ZeroPoint | NonzeroPoint;


function newCurve(a: bigint, b: bigint, modulus: bigint, order: bigint, generator: NonzeroPoint): Curve {
	const discriminant: bigint = 4n * a * a * a + 27n * b;
	if (discriminant === 0n) {
		throw Error("Discriminant is zero");
	} else {
		return {
			a,
			b,
			modulus,
			order,
			generator,
		};
	}
}

/**
 * The curve secp256r1, also called P-256.
 */
export function curveSecp256r1(): Curve {
	return newCurve(
		BigInt("0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFC"),
		BigInt("0x5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E27D2604B"),
		BigInt("0xFFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF"),
		BigInt("0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551"),
		{
			x: BigInt("0x6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296"),
			y: BigInt("0x4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5"),
		},
	);
}

/**
 * The curve secp521r1, also called P-521.
 */
export function curveSecp521r1(): Curve {
	return newCurve(
		BigInt("0x01fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc"),
		BigInt("0x0051953eb9618e1c9a1f929a21a0b68540eea2da725b99b315f3b8b489918ef109e156193951ec7e937b1652c0bd3bb1bf073573df883d2c34f1ef451fd46b503f00"),
		BigInt("0x01ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"),
		BigInt("0x01fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffa51868783bf2f966b7fcc0148f709a5d03bb5c9b8899c47aebb6fb71e91386409"),
		{
			x: BigInt("0x00c6858e06b70404e9cd9e3ecb662395b4429c648139053fb521f828af606b4d3dbaa14b5e77efe75928fe1dc127a2ffa8de3348b3c1856a429bf97e7e31c2e5bd66"),
			y: BigInt("0x011839296A789A3BC0045C8A5FB42C7D1BD998F54449579B446817AFBD17273E662C97EE72995EF42640C550B9013FAD0761353C7086A272C24088BE94769FD16650"),
		},
	);
}

/**
 * NOT CONSTANT TIME: Modular multiplicative inverse.
 */
function modinv(n: bigint, primeModulus: bigint): bigint {
	return modpow(n, primeModulus - 2n, primeModulus);
}

/**
 * NOT CONSTANT TIME: Modular exponentiation.
 */
function modpow(base: bigint, exp: bigint, modulus: bigint): bigint {
	let result: bigint = 1n;
	base %= modulus;

	while (exp > 0n) {
		if ((exp & 1n) === 1n) {
			result = result * base % modulus;
		}
		exp >>= 1n;
		base = base * base % modulus;
	}

	return result;
}

function find_y(crv: Curve, x: bigint): NonzeroPoint | null {
	const y_sq: bigint = (modpow(x, 3n, crv.modulus) + crv.a * x + crv.b) % crv.modulus;
	const y = sqrt(crv, y_sq);
	const p = { x, y };
	if (isOnCurve(crv, p)) {
		return p;
	} else {
		return null;
	}
}

function sqrt(crv: Curve, a: bigint): bigint {
	if (crv.modulus % 4n == 3n) {
		return modpow(a, ((crv.modulus + 1n) / 4n), crv.modulus);
	} else {
		throw new Error("Unimplemented");
	}
}

/** The additive inverse of the point `a`. */
function neg(crv: Curve, a: Point): Point {
	if (a === "zero") {
		return "zero";
	} else {
		return { x: a.x, y: crv.modulus - a.y };
	}
}


/**
 * NOT CONSTANT TIME: Modulo operation with a nonnegative result.
 */
function modpos(a: bigint, modulus: bigint): bigint {
	return ((a % modulus) + modulus) % modulus;
}

export function isOnCurve(crv: Curve, p: Point): boolean {
	if (p === "zero") {
		return true;
	} else {
		const lhs = modpow(p.y, 2n, crv.modulus);
		const rhs = modpos(modpow(p.x, 3n, crv.modulus) + crv.a * p.x + crv.b, crv.modulus);
		return lhs == rhs;
	}
}

export function pointEquals(p: Point, q: Point): boolean {
	return (p === "zero" && q === "zero")
		|| (
			p !== "zero"
			&& q !== "zero"
			&& (p.x === q.x)
			&& (p.y === q.y)
		);
}

/**
 * NOT CONSTANT TIME: Elliptic curve point addition on the given curve.
 */
export function vartimeAdd(crv: Curve, p: Point, q: Point): Point {
	if (p === "zero") {
		return q;
	} else if (q === "zero") {
		return p;
	} else {
		let k: bigint;
		const { x: px, y: py } = p;
		const { x: qx, y: qy } = q;
		if (px === qx) {
			if (py === modpos(-qy, crv.modulus)) {
				return "zero";
			} else {
				const kn: bigint = 3n * px * px + crv.a;
				const kd: bigint = 2n * py;
				k = kn * modinv(kd, crv.modulus);
			}
		} else {
			const kn = qy - py;
			const kd = qx - px;
			k = kn * modinv(kd, crv.modulus);
		}

		const xr = modpos(k * k - px - qx, crv.modulus);
		const yr = modpos(k * (px - xr) - py, crv.modulus);
		const r = { x: xr, y: yr };
		if (isOnCurve(crv, r)) {
			return r;
		} else {
			throw Error(`Point not on curve: ${r}`);
		}
	}
}

/**
 * NOT CONSTANT TIME: Elliptic curve point multiplication (addition repeated `k` times) on the given curve.
 */
export function vartimeMul(crv: Curve, p: Point, k: bigint): Point {
	let pPow2 = p;
	let result: Point = "zero";

	while (k > 0n) {
		if (k % 2n !== 0n) {
			result = vartimeAdd(crv, result, pPow2);
		}

		pPow2 = vartimeAdd(crv, pPow2, pPow2);
		k >>= 1n;
	}

	return result;
}


import { assert, describe, it, test } from "vitest";

export function tests() {
	// Define tests in this module so that we don't have to export private members
	// to the test module

	const SLOW_TESTS: boolean = process.env.SLOW_TESTS === 'true';

	function toU8(b: BufferSource): Uint8Array {
		if (b instanceof Uint8Array) {
			return b;
		} else if (b instanceof ArrayBuffer) {
			return new Uint8Array(b);
		} else {
			return new Uint8Array(b.buffer);
		}
	}

	function OS2IP(binary: BufferSource): bigint {
		return toU8(binary).reduce(
			(result: bigint, b: number) => (result << 8n) + BigInt(b),
			0n,
		);
	}

	/** INSECURELY generate a random number modulo the given modulus. */
	function randomBigint(modulus: bigint): bigint {
		const modulusLog2: number = modulus.toString(2).length + 1;
		const byteLen = Math.ceil(modulusLog2 / 8);
		return OS2IP(crypto.getRandomValues(new Uint8Array(byteLen))) % modulus;
	}

	/** INSECURELY generate a random nonzero point on the curve. */
	function randomNonzeroPoint(crv: Curve, retry_count: number = 20): NonzeroPoint {
		const x = randomBigint(crv.modulus);
		const p = find_y(crv, x);
		if (p) {
			return p;
		} else if (retry_count > 0) {
			return randomNonzeroPoint(crv, retry_count - 1);
		} else {
			throw new Error("Failed to generate random point");
		}
	}

	/** INSECURELY generate a random number modulo the curve order. */
	function randomScalar(crv: Curve): bigint {
		return randomBigint(crv.order);
	}

	describe("EC", () => {
		const testCurve = { name: "test", ...newCurve(0n, 7n, 37n, 3n * 13n, "zero" as unknown as NonzeroPoint) };
		const realCurves = [
			{ name: "secp256r1", ...curveSecp256r1() },
			{ name: "secp521r1", ...curveSecp521r1() },
		];

		describe("on the test curve", () => {
			const crv = testCurve;
			it("point addition is implemented correctly.", () => {
				const a = { x: 6n, y: 1n };
				const b = { x: 8n, y: 1n };
				const ab = vartimeAdd(crv, a, b);
				const expected = { x: 23n, y: 36n };
				assert.deepEqual(ab, expected);
			});
		});

		for (const crv of realCurves) {
			const slowCurve = crv.modulus > curveSecp256r1().modulus;

			describe(`on curve ${crv.name}`, () => {
				const a = randomNonzeroPoint(crv);
				const b = randomNonzeroPoint(crv);
				const c = randomNonzeroPoint(crv);

				describe("point addition", () => {
					it("with zero is a no-op.", () => {
						// A + 0 = 0 + A = 0
						assert.deepEqual(vartimeAdd(crv, a, "zero"), a);
						assert.deepEqual(vartimeAdd(crv, "zero", a), a);
					});

					it("with the additive inverse is zero.", () => {
						// A + (-A) = (-A) + A = 0
						const negA = neg(crv, a);
						assert.deepEqual(vartimeAdd(crv, a, negA), "zero");
						assert.deepEqual(vartimeAdd(crv, negA, a), "zero");
					});

					it("is closed.", () => {
						// A + B stays on the curve
						assert.isTrue(isOnCurve(crv, vartimeAdd(crv, a, b)));
					});

					it("is associative.", () => {
						// A + (B + C) = (A + B) + C
						assert.deepEqual(
							vartimeAdd(crv, a, vartimeAdd(crv, b, c)),
							vartimeAdd(crv, vartimeAdd(crv, a, b), c),
						);
					});

					it("is commutative.", () => {
						// A + B = B + A
						assert.deepEqual(vartimeAdd(crv, a, b), vartimeAdd(crv, b, a));
					});
				});

				describe("point multiplication", () => {
					// Limit to max 100 to keep vartimeMul evaluations fast
					const k = randomScalar(crv) % 100n;
					const l = randomScalar(crv) % 100n;

					it("with zero is zero.", () => {
						// 0 * A = 0
						assert.deepEqual(vartimeMul(crv, a, 0n), "zero");
					});

					it("with one is a no-op.", () => {
						// 1 * A = A
						assert.deepEqual(vartimeMul(crv, a, 1n), a);
					});

					test.runIf(SLOW_TESTS || !slowCurve)("with the curve order is zero.", () => {
						// N * A = 0
						assert.deepEqual(vartimeMul(crv, a, crv.order), "zero");
					});

					test.runIf(SLOW_TESTS || !slowCurve)("with the curve order minus one is the additive inverse.", () => {
						// (N - 1) * A = -A
						assert.deepEqual(vartimeMul(crv, a, crv.order - 1n), neg(crv, a));
					});

					it("distributes over addition.", () => {
						// k * (A + B) = (k * A) + (k * B)
						assert.deepEqual(
							vartimeMul(crv, vartimeAdd(crv, a, b), k),
							vartimeAdd(crv, vartimeMul(crv, a, k), vartimeMul(crv, b, k)),
						);
					});

					it("is associative in the scalar.", () => {
						// k * (l * A) = (k * l) * A
						assert.deepEqual(
							vartimeMul(crv, vartimeMul(crv, a, l), k),
							vartimeMul(crv, a, k * l),
						);
					});

					it("is commutative in the scalar.", () => {
						// k * (l * A) = l * (k * A)
						assert.deepEqual(
							vartimeMul(crv, vartimeMul(crv, a, k), l),
							vartimeMul(crv, vartimeMul(crv, a, l), k),
						);
					});
				});
			});
		}
	});
}
