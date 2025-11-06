import { RequestHeaders } from "../interfaces/IHttpProxy";
import { concat } from "./ohttpHelpers";

// --- RFC 9292 / QUIC-style varint encoder (1/2/4/8 bytes) ---
export function encVarint(v: number | bigint): Uint8Array {
	const n = typeof v === 'bigint' ? v : BigInt(v);
	if (n < 0n) throw new Error("varint must be non-negative");
	if (n <= 63n) {
		// 00xxxxxx
		return Uint8Array.of(Number(n & 0x3fn));
	} else if (n <= 16383n) {
		// 01xxxxxx (2 bytes)
		const val = Number(n);
		const b0 = 0x40 | ((val >>> 8) & 0x3f);
		const b1 = val & 0xff;
		return Uint8Array.of(b0, b1);
	} else if (n <= 1073741823n) {
		// 10xxxxxx (4 bytes)
		const val = Number(n);
		const b0 = 0x80 | ((val >>> 24) & 0x3f);
		const b1 = (val >>> 16) & 0xff;
		const b2 = (val >>> 8) & 0xff;
		const b3 = val & 0xff;
		return Uint8Array.of(b0, b1, b2, b3);
	} else if (n <= 4611686018427387903n) {
		// 11xxxxxx (8 bytes)
		let x = n;
		const out = new Uint8Array(8);
		out[0] = 0xC0 | Number((x >> 56n) & 0x3fn);
		out[1] = Number((x >> 48n) & 0xffn);
		out[2] = Number((x >> 40n) & 0xffn);
		out[3] = Number((x >> 32n) & 0xffn);
		out[4] = Number((x >> 24n) & 0xffn);
		out[5] = Number((x >> 16n) & 0xffn);
		out[6] = Number((x >> 8n) & 0xffn);
		out[7] = Number(x & 0xffn);
		return out;
	} else {
		throw new Error("varint too large (max 2^62-1)");
	}
}

export function u8(s: string | Uint8Array): Uint8Array {
	return typeof s === 'string' ? new TextEncoder().encode(s) : s;
}

// A single Field Line: NameLen(i), Name, ValueLen(i), Value
export function encFieldLine(name: string, value: string | Uint8Array): Uint8Array {
	if (!name || /[A-Z]/.test(name))
		throw new Error("field name must be lowercase and non-empty");
	const n = u8(name);
	const v = u8(value);
	if (n.length < 1) throw new Error("field name must be at least 1 byte");
	return concat(encVarint(n.length), n, encVarint(v.length), v);
}

// Known-Length Field Section:
//   Length(i) = total bytes of concatenated Field Lines (no terminator)
//   FieldLine...
export function encKnownFieldSection(headers: Array<[string, string | Uint8Array]>): Uint8Array {
	const lines = headers.map(([k, v]) => encFieldLine(k, v));
	const body = concat(...lines);
	return concat(encVarint(body.length), body);
}

// Indeterminate-Length Field Section:
//   FieldLine... ; then Content Terminator(i)=0
export function encIndetFieldSection(headers: Array<[string, string | Uint8Array]>): Uint8Array {
	const lines = headers.map(([k, v]) => encFieldLine(k, v));
	return concat(...lines, encVarint(0));
}

// Request Control Data:
//   MethodLen(i), Method, SchemeLen(i), Scheme,
//   AuthorityLen(i), Authority, PathLen(i), Path
export function encRequestControlData(
	method: string,
	scheme: string,
	authority: string,   // can be ""
	path: string         // e.g. "/foo?bar=baz"
): Uint8Array {
	const m = u8(method);
	const s = u8(scheme);
	const a = u8(authority); // may be length 0
	const p = u8(path);
	return concat(
		encVarint(m.length), m,
		encVarint(s.length), s,
		encVarint(a.length), a,
		encVarint(p.length), p
	);
}

// --- Content encoders ---
export function encKnownContent(body: Uint8Array): Uint8Array {
	// const b = body ?? new Uint8Array(0);
	return concat(encVarint(body.length), body);
}

// Indeterminate content: ChunkLen(i)>0, Chunk..., ... , 0
export function encIndetContent(chunks: Uint8Array[]): Uint8Array {
	const parts: Uint8Array[] = [];
	for (const c of chunks) {
		if (!c || c.length === 0) continue;  // skip empty
		parts.push(encVarint(c.length), c);
	}
	parts.push(encVarint(0)); // terminator
	return concat(...parts);
}

// --- Known-Length Request ---
// FramingIndicator(i)=0, RequestControlData, Known-Length Header Section,
// Known-Length Content, Known-Length Trailer Section, (optional) Padding(zeros)
export function encodeKnownLengthRequest(opts: {
	method: string;
	scheme: string;            // e.g. "https"
	authority: string;         // host[:port], "" allowed
	path: string;              // absolute-path + query
	headers?: Array<[string, string | Uint8Array]>;
	body?: Uint8Array;         // undefined = omit section; Uint8Array(0) = explicit empty
	trailers?: Array<[string, string | Uint8Array]>;
	padBytes?: number;
}): Uint8Array {
	const framing = encVarint(0); // known-length request
	const rcd = encRequestControlData(opts.method, opts.scheme, opts.authority, opts.path);

	const hdrs = encKnownFieldSection(opts.headers ?? []);
	const trls = encKnownFieldSection(opts.trailers ?? []);

	const bodyProvided = opts.body !== undefined;
	const trailersEmpty = !opts.trailers || opts.trailers.length === 0;

	const parts: Uint8Array[] = [framing, rcd, hdrs];

	if (bodyProvided || !trailersEmpty) {
		// If body is provided, encode it (even if length=0). If not provided but trailers
		// exist, RFC requires a content section (which will be length=0).
		const bodyToEncode = opts.body ?? new Uint8Array(0);
		parts.push(encKnownContent(bodyToEncode));

		// Trailer section must follow content; if caller provided none, emit zero-length section.
		parts.push(trailersEmpty ? encVarint(0) : trls);
	}
	// else: both content and trailers omitted (legal truncation)

	if (opts.padBytes && opts.padBytes > 0) parts.push(new Uint8Array(opts.padBytes)); // optional zero padding
	return concat(...parts);
}

// --- Indeterminate-Length Request ---
// FramingIndicator(i)=2, RequestControlData, Indet Header Section,
// Indet Content, Indet Trailer Section, (optional) Padding
export function encodeIndeterminateLengthRequest(opts: {
	method: string;
	scheme: string;
	authority: string;
	path: string;
	headers?: Array<[string, string | Uint8Array]>;
	bodyChunks?: Uint8Array[];   // zero or more chunks
	trailers?: Array<[string, string | Uint8Array]>;
	padBytes?: number;
}): Uint8Array {
	const framing = encVarint(2); // indeterminate-length request
	const rcd = encRequestControlData(opts.method, opts.scheme, opts.authority, opts.path);

	const hdrs = encIndetFieldSection(opts.headers ?? []);
	const content = encIndetContent(opts.bodyChunks ?? []);
	const trls = encIndetFieldSection(opts.trailers ?? []);

	const parts: Uint8Array[] = [framing, rcd, hdrs, content, trls];
	if (opts.padBytes && opts.padBytes > 0) parts.push(new Uint8Array(opts.padBytes));
	return concat(...parts);
}

// --- Convenience: build headers from a JS object (lowercases keys) ---
export function headersFromObject(obj: RequestHeaders): Array<[string, string | Uint8Array]> {
	if (obj) {
		return Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v]);
	} else {
		return [];
	}
}

const td = new TextDecoder();

export function decVarint(u8: Uint8Array, off: number): [number, number] {
	if (off >= u8.length) throw new Error("varint: truncated");
	const b0 = u8[off];
	const tag = b0 >>> 6; // 0,1,2,3 -> 1,2,4,8 bytes
	const size = [1, 2, 4, 8][tag];
	if (off + size > u8.length) throw new Error("varint: truncated");

	if (size === 1) return [b0 & 0x3f, off + 1];
	if (size === 2) {
		const v = ((b0 & 0x3f) << 8) | u8[off + 1];
		return [v >>> 0, off + 2];
	}
	if (size === 4) {
		const v = ((b0 & 0x3f) * 2 ** 24) | (u8[off + 1] << 16) | (u8[off + 2] << 8) | u8[off + 3];
		return [v >>> 0, off + 4]; // max 2^30-1
	}
	// size === 8 -> use BigInt then downcast safely
	let v = (BigInt(b0 & 0x3f) << 56n)
				| (BigInt(u8[off + 1]) << 48n)
				| (BigInt(u8[off + 2]) << 40n)
				| (BigInt(u8[off + 3]) << 32n)
				| (BigInt(u8[off + 4]) << 24n)
				| (BigInt(u8[off + 5]) << 16n)
				| (BigInt(u8[off + 6]) << 8n)
				| BigInt(u8[off + 7]);
	const max = BigInt(Number.MAX_SAFE_INTEGER);
	if (v > max) throw new Error("varint too large for JS number");
	return [Number(v), off + 8];
}

export function decLenBytes(u8: Uint8Array, off: number): [Uint8Array, number] {
	const [len, off2] = decVarint(u8, off);
	const end = off2 + len;
	if (end > u8.length) throw new Error("len-bytes: truncated");
	return [u8.subarray(off2, end), end];
}

export function decAscii(u8: Uint8Array): string {
	return td.decode(u8);
}

type Header = [string, string];

export function decFieldLine(u8: Uint8Array, off: number): [{ name: string; value: Uint8Array }, number] {
	const [nameBytes, o1] = decLenBytes(u8, off);
	if (nameBytes.length < 1) throw new Error("field name must be at least 1 byte");
	const name = decAscii(nameBytes);
	if (/[A-Z]/.test(name)) throw new Error("field name must be lowercase");
	const [valBytes, o2] = decLenBytes(u8, o1);
	return [{ name, value: valBytes }, o2];
}

export function decKnownFieldSection(u8: Uint8Array, off: number): { headers: Header[]; off: number } {
	const [sectionLen, o1] = decVarint(u8, off);
	const end = o1 + sectionLen;
	if (end > u8.length) throw new Error("field section truncated");

	const headers: Header[] = [];
	let p = o1;
	while (p < end) {
		const [{ name, value }, p2] = decFieldLine(u8, p);
		headers.push([name, decAscii(value)]);
		p = p2;
	}
	if (p !== end) throw new Error("field section length mismatch");
	return { headers, off: end };
}

export function decRequestControlData(u8: Uint8Array, off: number) {
	const [mBytes, o1] = decLenBytes(u8, off);
	const [sBytes, o2] = decLenBytes(u8, o1);
	const [aBytes, o3] = decLenBytes(u8, o2);
	const [pBytes, o4] = decLenBytes(u8, o3);
	return {
		method: decAscii(mBytes),
		scheme: decAscii(sBytes),
		authority: decAscii(aBytes),
		path: decAscii(pBytes),
		off: o4,
	};
}

export function decodeKnownLengthRequest(buf: Uint8Array) {
	let off = 0;

	// Framing Indicator (must be 0 for Known-Length Request)
	const [fi, o0] = decVarint(buf, off);
	if (fi !== 0) throw new Error(`unexpected framing indicator ${fi} (want 0)`);
	off = o0;

	// Request Control Data
	const r = decRequestControlData(buf, off);
	off = r.off;

	// Header Section (Known-Length)
	const { headers, off: oHdr } = decKnownFieldSection(buf, off);
	off = oHdr;

	// Per RFC 9292, if both content & trailers are empty, they MAY be omitted.
	// Otherwise: Known-Length Content, then Known-Length Trailer Section.
	let body = buf.subarray(0, 0);
	let trailers: Header[] = [];

	if (off < buf.length) {
		// Known-Length Content
		const [contentLen, oC1] = decVarint(buf, off);
		const cEnd = oC1 + contentLen;
		if (cEnd > buf.length) throw new Error("content truncated");
		body = buf.subarray(oC1, cEnd);
		off = cEnd;

		// Known-Length Trailer Section (often length=0)
		const { headers: trls, off: oTr } = decKnownFieldSection(buf, off);
		trailers = trls;
		off = oTr;
	}

	// Optional padding: trailing zero bytes only
	let padBytes = 0;
	while (off < buf.length) {
		if (buf[off] !== 0x00) throw new Error("non-zero bytes after end of message");
		padBytes++; off++;
	}

	return {
		method: r.method,
		scheme: r.scheme,
		authority: r.authority,
		path: r.path,
		headers,
		body,        // Uint8Array
		trailers,    // Header[]
		padBytes,    // number of zero padding bytes seen
	};
}

// Response Control Data: status code (varint)
export function decResponseControlData(u8: Uint8Array, off: number): [number, number] {
	const [status, o1] = decVarint(u8, off);
	if (status < 100 || status > 599) throw new Error(`invalid status ${status}`);
	return [status, o1];
}

export function decodeKnownLengthResponse(buf: Uint8Array) {
	let off = 0;

	// Framing Indicator must be 1 (Known-Length Response)
	const [fi, o0] = decVarint(buf, off);
	if (fi !== 1) throw new Error(`unexpected framing indicator ${fi} (want 1)`);
	off = o0;

	// Zero or more informational responses (1xx), each followed by a header section
	const infos: Array<{ status: number; headers: [string, string][] }> = [];
	while (true) {
		const [status, o1] = decResponseControlData(buf, off);
		off = o1;
		if (status >= 200) {
			// final status → break with `status` already read
			var finalStatus = status;
			break;
		}
		const { headers, off: oHdr } = decKnownFieldSection(buf, off);
		infos.push({ status, headers });
		off = oHdr;
	}

	// Final header section
	const { headers, off: oHdr2 } = decKnownFieldSection(buf, off);
	const headersObj: Record<string, string> = Object.fromEntries(headers);
	off = oHdr2;

	// Content (known-length) + Trailers (known-length) — both MAY be omitted
	let body = buf.subarray(0, 0);
	let trailers: [string, string][] = [];

	if (off < buf.length) {
		const [contentLen, oC1] = decVarint(buf, off);
		const cEnd = oC1 + contentLen;
		if (cEnd > buf.length) throw new Error("content truncated");
		body = buf.subarray(oC1, cEnd);
		off = cEnd;

		const { headers: trls, off: oTr } = decKnownFieldSection(buf, off);
		trailers = trls;
		off = oTr;
	}

	// Optional zero padding
	let padBytes = 0;
	while (off < buf.length) {
		if (buf[off] !== 0x00) throw new Error("non-zero bytes after end of message");
		padBytes++; off++;
	}

	return { status: finalStatus, infos, headers: headersObj, body, trailers, padBytes };
}
