export function toU8(b: BufferSource): Uint8Array {
	if (b instanceof Uint8Array) {
		return b;
	} else if ("buffer" in b) {
		return new Uint8Array(b.buffer);
	} else if ("byteLength" in b) {
		const u = new Uint8Array(b);
		if (u.length === b.byteLength) {
			return u;
		}
	}
	throw new Error(`Unknown binary type: ${typeof b} ${b}`, { cause: b })
}

export function toHex(b: BufferSource): string {
	return toU8(b).reduce((s, byte) => s + byte.toString(16).padStart(2, '0'), '');
}

export const HEX_ERR_LENGTH_ODD = 'LENGTH_ODD';
export const HEX_ERR_INVALID_DIGITS = 'INVALID_DIGITS';

export function fromHex(hex: string): Uint8Array {
	/* eslint-disable no-bitwise */

	const normalized = hex.replaceAll(' ', '');

	if (normalized.length % 2 !== 0) {
		throw Error(`Invalid hex string: ${hex}`, { cause: HEX_ERR_LENGTH_ODD });

	} else if (!normalized.match(/^[a-fA-F0-9]*$/u)) {
		throw Error(`Invalid hex string: ${hex}`, { cause: HEX_ERR_INVALID_DIGITS });

	} else {
		return new Uint8Array(
			normalized
				.split('')
				.reduce(
					(bytes, digit, i) => {
						if (i % 2 === 0) {
							bytes.push(parseInt(digit, 16) << 4);
						} else {
							bytes[bytes.length - 1] |= parseInt(digit, 16);
						}
						return bytes;
					},
					[],
				)
		);
	}
};

export function concat(...bs: BufferSource[]): ArrayBuffer {
	const bu8 = bs.map(toU8);
	const result = new Uint8Array(bu8.reduce((len, b) => len + b.length, 0));
	bu8.reduce(
		(offset, b) => {
			result.set(b, offset);
			return offset + b.length;
		},
		0,
	);
	return result.buffer;
}

/**
	Convert a big-endian octet string to a nonnegative integer.

	@see https://www.rfc-editor.org/rfc/rfc8017.html#section-4.2
	*/
export function OS2IP(binary: BufferSource): bigint {
	return toU8(binary).reduce(
		(result: bigint, b: number) => (result << 8n) + BigInt(b),
		0n,
	);
}

/**
	Convert a nonnegative integer to a big-endian octet string of a specified length.

	@see https://www.rfc-editor.org/rfc/rfc8017.html#section-4.1
	*/
export function I2OSP(a: bigint, length: number): ArrayBuffer {
	return new Uint8Array(length).map(
		(_, i: number): number =>
			Number(BigInt.asUintN(8, a >> (BigInt(length - 1 - i) * 8n)))
	).buffer;
}

export function toBase64(binary: BufferSource): string {
	const uint8Array = toU8(binary);
	const chunkSize = 0x8000; // 32KB
	let result = '';
	for (let i = 0; i < uint8Array.length; i += chunkSize) {
		const chunk = uint8Array.subarray(i, i + chunkSize);
		result += String.fromCharCode(...chunk);
	}
	return btoa(result);
}

export function toBase64Url(binary: BufferSource): string {
	return toBase64(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function byteArrayEquals(a: BufferSource, b: BufferSource): boolean {
	return toBase64(a) === toBase64(b);
}

function base64pad(s: string): string {
	const m = s.length % 4;
	if (m === 0) {
		return s;
	} else if (m === 2) {
		return s + "==";
	} else if (m === 3) {
		return s + "=";
	} else {
		throw Error("Invalid length of Base64 encoded data");
	}
}

export function fromBase64(s: string): Uint8Array {
	return new Uint8Array(Array.from(atob(base64pad(s))).map(c => c.charCodeAt(0)));
}

export function fromBase64Url(s: string): Uint8Array {
	return fromBase64(s.replace(/-/g, "+").replace(/_/g, "/"));
}

function replacerUint8ArrayToTaggedBase64Url(key: string, value: any): any {
	if (this[key] instanceof Uint8Array || this[key] instanceof ArrayBuffer) {
		return { '$b64u': toBase64Url(toU8(this[key])) };
	} else {
		return value;
	}
}

export function jsonStringifyTaggedBinary(value: any): string {
	return JSON.stringify(value, replacerUint8ArrayToTaggedBase64Url);
}

function reviverTaggedBinaryToUint8Array(key: string, value: any): any {
	if (value?.$b64u !== undefined) {
		return fromBase64Url(value["$b64u"]);
	} else {
		return value;
	}
}

export function jsonParseTaggedBinary(json: string): any {
	return JSON.parse(json, reviverTaggedBinaryToUint8Array);
}

/**
	Create a comparator function comparing the result of passing each argument through the given function.
	The function returned by `compareBy` is suitable as an argument to `Array.sort()`, for example.

	Example:
	```
	list.sort(compareBy(obj => new Date(obj.issuanceDate)));
	```

	The above is equivalent to:
	```
	list.sort((objA, objB) => new Date(objB.issuanceDate) - new Date(objA.issuanceDate));
	```
 */
export function compareBy<T, U>(f: (v: T) => U): (a: T, b: T) => number {
	return (a: T, b: T) => {
		const fa = f(a);
		const fb = f(b);
		if (fa < fb) {
			return -1;
		} else if (fb < fa) {
			return 1;
		} else {
			return 0;
		}
	};
}

/** Reverse the given comparator function. */
export function reverse<T>(f: (a: T, b: T) => number): (a: T, b: T) => number {
	return (a: T, b: T) => -f(a, b);
}

/**
 * Wrap `action` so that it will not execute again for `timeoutMillis` milliseconds after each execution.
 */
export function throttle(action: () => void, timeoutMillis: number): () => void {
	let ready = true;
	const setReady = () => { ready = true; };
	return () => {
		if (ready) {
			ready = false;
			action();
			setTimeout(setReady, timeoutMillis);
		}
	};
};

/** Return the byte length of `s` in the UTF-8 encoding. */
export function calculateByteSize(s: string): number {
	const encoder = new TextEncoder();
	const encoded = encoder.encode(s);
	return encoded.length;
};

/** Return a shallow copy of `o` containing only the key-value pairs for which `predicate` returns `true`. */
export function filterObject<T>(o: { [key: string]: T }, predicate: (v: T, k: string) => boolean): { [key: string]: T } {
	return Object.entries(o).reduce(
		(result, [k, v]) => {
			if (predicate(v, k)) {
				result[k] = v;
			}
			return result;
		},
		{},
	);
}

// To get the values of possible nested properties
export function getElementPropValue(
	obj: any,
	property: string
): string | number | undefined {
	let value = obj;
	const propsArray = property.split(".");
	while (propsArray.length) {
		if (!value) {
			break;
		}
		value = value[propsArray.shift()];
	}
	return value;
}

/**
 * Removes all characters from the input string except for:
 * - Letters (a-z, A-Z)
 * - Numbers (0-9)
 * - Hyphens (-)
 * - Underscores (_)
 *
 * Useful for generating safe HTML id attributes.
 *
 * @param value - The string to sanitize
 * @returns A sanitized string safe for use in HTML IDs
 */
export function sanitizeId(value: string | number): string {
	const str = String(value);
	return str.replace(/[^a-zA-Z0-9-_]/g, "");
}

/**
 * Evaluate the given promises sequentially, rather than in parallel, and return
 * a list of their results in order.
 */
export async function sequentialAll<T>(beginPromises: (() => Promise<T>)[]): Promise<T[]> {
	const results: T[] = [];
	for (const beginPromise of beginPromises) {
		results.push(await beginPromise());
	}
	return results;
}
