type Curve = {
	a: bigint,
	b: bigint,
	modulus: bigint,
	order: bigint,
	generator: Point,
};

export type Point = "zero" | { x: bigint, y: bigint };


function newCurve(a: bigint, b: bigint, modulus: bigint, order: bigint, generator: Point): Curve {
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


function tests() {
	function ecArithmeticWorks() {
		const crv = newCurve(0n, 7n, 37n, 3n * 13n, "zero");
		const a = { x: 6n, y: 1n };
		const b = { x: 8n, y: 1n };
		const ab = vartimeAdd(crv, a, b);
		const expected = { x: 23n, y: 36n };
		if (!pointEquals(ab, expected)) {
			console.log("Expected", a, " + ", b, " = ", expected, ", got: ", ab);
		}

		// assert_eq!(Mpz:: from(13), crv.find_order(& Point:: from(6, 1)));
		console.log("Test successful!");
	}
	ecArithmeticWorks();
}
