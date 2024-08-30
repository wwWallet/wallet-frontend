import { assert } from "vitest";

export async function asyncAssertThrows(fn: () => Promise<any>, message: string): Promise<unknown> {
	try {
		await fn();
	} catch (e) {
		return e;
	}
	assert.fail(message);
}
