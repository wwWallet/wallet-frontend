import { assert, describe, it } from "vitest";
import { compareBy } from "./util";

describe("compareBy", () => {
	it("always returns zero if no comparator functions were given.", async () => {
		const list = [3, 1, 2];
		const comp = compareBy();
		assert.deepEqual(list.flatMap(a => list.map(b => comp(a, b))), [0, 0, 0, 0, 0, 0, 0, 0, 0]);
		list.sort(comp);
		assert.deepEqual(list, [3, 1, 2]);
	});

	it("sorts by Date objects as expected.", async () => {
		const a = new Date("2025-08-27T00:00:00Z");
		const b = new Date("2025-08-28T00:00:00Z");
		const c = new Date("2025-08-29T00:00:00Z");
		const list = [{ t: c }, { t: a }, { t: b }];
		const comp = compareBy((o: { t: Date }) => o.t);
		assert.deepEqual(list.flatMap(a => list.map(b => comp(a, b))), [0, 1, 1, -1, 0, -1, -1, 1, 0]);
		list.sort(comp);
		assert.deepEqual(list, [{ t: a }, { t: b }, { t: c }]);
	});

	it("sorts by multiple comparators as expected.", async () => {
		const ia = 42;
		const ib = 7;
		const ic = 42;
		const ta = new Date("2025-08-27T00:00:00Z");
		const tb = new Date("2025-08-28T00:00:00Z");
		const tc = new Date("2025-08-29T00:00:00Z");
		const list = [{ i: ic, t: tc }, { i: ia, t: ta }, { i: ib, t: tb }];
		const comp = compareBy((o: { i: number, t: Date }) => o.i, o => o.t);
		assert.deepEqual(list.flatMap(a => list.map(b => comp(a, b))), [0, 1, 1, -1, 0, 1, -1, -1, 0]);
		list.sort(comp);
		assert.deepEqual(list, [{ i: ib, t: tb }, { i: ia, t: ta }, { i: ic, t: tc }]);
	});
});
