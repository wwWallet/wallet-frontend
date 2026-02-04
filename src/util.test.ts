import { assert, describe, it } from "vitest";
import { compareBy } from "./util";

describe("compareBy", () => {
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
});
