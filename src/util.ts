/** Return the value unchanged. Useful for narrowing string literals into an
enumerated union type, for example. */
export function coerce<T>(value: T): T {
	return value;
}


function toU8(b: BufferSource) {
	if (b instanceof ArrayBuffer) {
		return new Uint8Array(b);
	} else {
		return new Uint8Array(b.buffer);
	}
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

/** Get the last element of `arr`, or `undefined` if `arr` is empty or nullish. */
export function last<T>(arr: T[]): T | undefined {
	return arr ? arr[arr.length - 1] : undefined;
}

/**
	Like `Array.findIndex`, but returns the index past the end of the array
	instead of -1 if no matching element is found.
	*/
export function findIndexOrEnd<T>(arr: T[], predicate: (element: T) => boolean): number {
	const index = arr.findIndex(predicate);
	if (index === -1) {
		return arr.length;
	} else {
		return index;
	}
}

/**
	Split `arr` into two contiguous segments. The second segment begins with the
	first element that satisfies the `predicate`.

	If no element satisfies the `predicate`, then the first segment is a shallow
	copy of `arr` and the second segment is empty.
	*/
export function splitWhen<T>(arr: T[], predicate: (element: T) => boolean): [T[], T[]] {
	const splitIndex = findIndexOrEnd(arr, predicate);
	return [arr.slice(0, splitIndex), arr.slice(splitIndex)];
}

/**
	Filter `arr` for duplicates as determined by `f`, keeping the first element
	of each duplicate class.
	*/
export function deduplicateBy<T, U extends (string | number | boolean | bigint | symbol)>(
	arr: T[],
	f: (element: T) => U,
): T[] {
	return [
		...arr.reduce(
			(map, e: T) => {
				const key = f(e);
				if (!map.has(key)) {
					map.set(key, e);
				}
				return map;
			},
			new Map<U, T>(),
		).values(),
	];
}

/**
	Filter `arr` for duplicates as determined by `f`, keeping the last element of
	each duplicate class.
	*/
export function deduplicateFromRightBy<T, U extends (string | number | boolean | bigint | symbol)>(
	arr: T[],
	f: (element: T) => U,
): T[] {
	return [
		...arr.reduce(
			(map, e: T) => {
				map.set(f(e), e);
				return map;
			},
			new Map<U, T>(),
		).values(),
	];
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

/**
	Return the element of `arr` for which the value returned by `byKey` is
	greatest, as determined by the `>` operator.

	If `arr` is empty, return `undefined`.

	If the maximum is not unique, return the first maximum.
	 */
export function maxByKey<T, U extends string | number | boolean | bigint>(arr: T[], byKey: (v: T) => U): T | undefined {
	if (arr.length === 0) {
		return undefined;
	} else {
		return arr.slice(1).reduce<[T, U]>(
			([max, maxKey], next) => {
				const nextKey = byKey(next);
				return (nextKey > maxKey) ? [next, nextKey] : [max, maxKey];
			},
			[arr[0], byKey(arr[0])],
		)[0];
	}
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
