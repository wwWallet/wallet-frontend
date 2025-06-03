import { assert, describe, it, test } from "vitest";

import {
	Curve,
	NonzeroPoint,
	curveSecp256r1,
	curveSecp521r1,
	find_y,
	isOnCurve,
	neg,
	newCurve,
	vartimeAdd,
	vartimeMul,
} from "./ec";
import { OS2IP } from "../util";


const SLOW_TESTS: boolean = process.env.SLOW_TESTS === 'true';

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
	const testCurve = { name: "test", ...newCurve(0n, 7n, 37n, 3n * 13n, "zero" as unknown as NonzeroPoint, "") };
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
