import { assert, describe, it } from "vitest";
import { hash_to_field } from "@noble/curves/abstract/hash-to-curve";
import { sha256 } from '@noble/hashes/sha2';

import { hashToCurve, SuiteId } from "../arkg/hash_to_curve";


describe("hashToScalarField agrees with @noble/abstract/hash-to-curve", () => {
	describe("for input:", async () => {
		const DST = "test";
		const functionSuite = hashToCurve("P256_XMD:SHA-256_SSWU_RO_" as SuiteId, new TextEncoder().encode(DST));
		const { hashToScalarField } = functionSuite;

		for (const msg of ["test", "foo", "bar"].slice(0, 1)) {
			it(msg, async () => {
				const msgBytes = new TextEncoder().encode(msg);
				const [[result1]] = await hashToScalarField(msgBytes, 1);
				const [[result2]] = hash_to_field(msgBytes, 1, {
					DST: new TextEncoder().encode(DST),
					p: 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n,
					m: 1,
					k: 128,
					expand: 'xmd',
					hash: sha256,
				});

				assert.equal(result1, result2);
			});
		}
	});
});
