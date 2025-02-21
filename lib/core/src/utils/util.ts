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
