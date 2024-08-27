export function toU8(b: BufferSource): Uint8Array {
	if (b instanceof Uint8Array) {
		return b;
	} else if (b instanceof ArrayBuffer) {
		return new Uint8Array(b);
	} else {
		return new Uint8Array(b.buffer);
	}
}

export function toHex(b: BufferSource): string {
	return toU8(b).reduce((s, byte) => s + byte.toString(16).padStart(2, '0'), '');
}

export function concat(...b: BufferSource[]): ArrayBuffer {
	return b.map(toU8).reduce((a, b) => new Uint8Array([...a, ...b]), new Uint8Array([])).buffer;
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
	return btoa(String.fromCharCode.apply(String, toU8(binary)));
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
