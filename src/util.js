function toU8(b) {
	if (b instanceof Uint8Array) {
		return b;
	} else {
		return new Uint8Array(b);
	}
}

export function toBase64(binary) {
	return btoa(String.fromCharCode.apply(String, toU8(binary)));
}

export function toBase64Url(binary) {
	return toBase64(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64pad(s) {
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

export function fromBase64(s) {
	return new Uint8Array(Array.from(atob(base64pad(s))).map(c => c.charCodeAt(0)));
}

export function fromBase64Url(s) {
	return fromBase64(s.replaceAll("-", "+").replaceAll("_", "/"));
}

function replacerUint8ArrayToTaggedBase64Url(key, value) {
	if (this[key] instanceof Uint8Array || this[key] instanceof ArrayBuffer) {
		return { '$b64u': toBase64Url(toU8(this[key])) };
	} else {
		return value;
	}
}

export function jsonStringifyTaggedBinary(value) {
  return JSON.stringify(value, replacerUint8ArrayToTaggedBase64Url);
}

function reviverTaggedBinaryToUint8Array(key, value) {
	if (value?.$b64u !== undefined) {
		return fromBase64Url(value["$b64u"]);
	} else {
		return value;
	}
}

export function jsonParseTaggedBinary(json) {
  return JSON.parse(json, reviverTaggedBinaryToUint8Array);
}
