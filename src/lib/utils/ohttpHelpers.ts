import { CipherSuite, HkdfSha256, Aes128Gcm } from '@hpke/core'
import { DhkemX25519HkdfSha256 } from '@hpke/dhkem-x25519'
import axios from 'axios'
import { decodeKnownLengthResponse, encodeKnownLengthRequest, headersFromObject } from './bhttp';
import { RequestHeaders } from '../interfaces/IHttpProxy';

export type HpkeConfig = {
	keyId: number;
	kemId: number;
	kdfId: number;
	aeadId: number;
	publicKey: Uint8Array;
	pubHex: string;
};

type KdfAead = { kdfId: number; aeadId: number }
type KeyConfig = { keyId: number; kemId: number; publicKey: Uint8Array; pairs: KdfAead[] }

export type HttpRequestParameters = {
	method: "GET" | "POST",
	url: string,
	headers: RequestHeaders,
	body?: string | object
}

export const toHex = (u8?: Uint8Array | null) => u8 ? [...u8].map(b => b.toString(16).padStart(2, '0')).join('') : ''

export const toArrayBuffer = (u8: Uint8Array) => {
	if (
		u8.byteOffset === 0 &&
		u8.buffer instanceof ArrayBuffer &&
		u8.buffer.byteLength === u8.byteLength
	) {
		return u8.buffer; // exact ArrayBuffer
	}
	// otherwise, copy into a fresh ArrayBuffer (so that it always returns ArrayBuffer)
	const ab = new ArrayBuffer(u8.byteLength);
	new Uint8Array(ab).set(u8);
	return ab;
}

export function encode1(val: number): Uint8Array {
	if (val < 0 || val > 0xff) throw new Error("encode1: out of range");
	return Uint8Array.of(val & 0xff);
}

export function encode2(val: number): Uint8Array {
	if (val < 0 || val > 0xffff) throw new Error("encode2: out of range");
	return Uint8Array.of((val >>> 8) & 0xff, val & 0xff);
}

// concat multiple Uint8Arrays
export function concat(...parts: Uint8Array[]): Uint8Array {
	const total = parts.reduce((n, a) => n + a.length, 0);
	const out = new Uint8Array(total);
	let off = 0;
	for (const p of parts) { out.set(p, off); off += p.length; }
	return out;
}

export const parseOhttpKeys = (buf: ArrayBuffer): KeyConfig[] => {
	const dv = new DataView(buf)
	const out: KeyConfig[] = []
	let off = 0
	while (off + 2 <= dv.byteLength) {
		const cfgLen = dv.getUint16(off, false); off += 2
		if (off + cfgLen > dv.byteLength) break
		const base = off
		let p = 0

		const keyId = dv.getUint8(base + p); p += 1
		const kemId = dv.getUint16(base + p, false); p += 2

		// demo: support X25519 (0x0020) only
		const pubLen = kemId === 0x0020 ? 32 : (() => { throw new Error(`Unsupported KEM 0x${kemId.toString(16)}`) })()
		// const pubLen = 32;
		const publicKey = new Uint8Array(buf, base + p, pubLen); p += pubLen

		const algsLen = dv.getUint16(base + p, false); p += 2
		if (algsLen % 4 !== 0) throw new Error('Bad algs length')
		const pairs: KdfAead[] = []
		for (let i = 0; i < algsLen; i += 4) {
			const kdfId = dv.getUint16(base + p + i + 0, false)
			const aeadId = dv.getUint16(base + p + i + 2, false)
			pairs.push({ kdfId, aeadId })
		}

		out.push({ keyId, kemId, publicKey: new Uint8Array(publicKey), pairs })
		off += cfgLen
	}
	return out
}

const buildSuite = (kdfId: number, aeadId: number) => {
	// demo: KDF must be HKDF-SHA256 (0x0001) for our helper
	if (kdfId !== 0x0001) throw new Error(`Unsupported KDF 0x${kdfId.toString(16)} in demo`)
	const kem = new DhkemX25519HkdfSha256()
	const kdf = new HkdfSha256()
	if (aeadId !== 0x0001) throw new Error(`Unsupported AEAD 0x${aeadId.toString(16)} in demo`)
	const aead = new Aes128Gcm()
	return new CipherSuite({ kem, kdf, aead })
}

const importGatewayPublicKey = async (suite: CipherSuite, raw: Uint8Array) => {
	const kem: any = (suite as any).kem

	if (typeof kem.deserializePublicKey === 'function') {
		return await kem.deserializePublicKey(raw)
	}
}

// Derive `len` bytes using HKDF-SHA256 with arbitrary salt
// Avoid hpke lib because of weird salt size limitation
async function hkdfExpandWebCrypto(
	ikm: ArrayBuffer,            // HPKE-exported `secret`
	salt: Uint8Array,            // enc || response_nonce
	infoLabel: string,           // "key" or "nonce"
	len: number                  // bytes to derive
): Promise<Uint8Array> {
	const baseKey = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
	const info = new TextEncoder().encode(infoLabel);
	const bits = await crypto.subtle.deriveBits(
		{ name: "HKDF", hash: "SHA-256", salt: toArrayBuffer(salt), info },
		baseKey,
		len * 8
	);
	return new Uint8Array(bits);
}

async function decryptEncapsulatedResponse(
	suite: CipherSuite,
	sender: any,                     // HPKE sender context
	encFromRequest: ArrayBuffer,     // enc
	encResponseBuf: ArrayBuffer      // bytes from relay's HTTP body
): Promise<Uint8Array> {
	// TODO: unhardcode these
	const Nk = 16; // key bytes
	const Nn = 12; // nonce bytes
	const L = Math.max(Nk, Nn);

	const encU8 = new Uint8Array(encFromRequest);
	const respU8 = new Uint8Array(encResponseBuf);
	if (respU8.length < L) throw new Error("ohttp-res too short");

	const responseNonce = respU8.slice(0, L);
	const ct = respU8.slice(L);

	// RFC 9458 §4.4 step 1: exporter secret
	const exporterCtx = new TextEncoder().encode("message/bhttp response");
	const secret = await sender.export(exporterCtx, L); // length = max(Nn, Nk)

	// RFC 9458 §4.4 steps 3–5: HKDF( salt=enc||responseNonce )
	//const kdf: any = (suite as any).kdf;
	const salt = concat(encU8, responseNonce);
	// const prk  = await kdf.extract(toArrayBuffer(salt), secret);
	// const aeadKey   = await kdf.expand(prk, new TextEncoder().encode("key"),   Nk);
	// const aeadNonce = await kdf.expand(prk, new TextEncoder().encode("nonce"), Nn);
	const aeadKey = await hkdfExpandWebCrypto(secret, salt, "key", Nk);
	const aeadNonce = await hkdfExpandWebCrypto(secret, salt, "nonce", Nn);


	const aeadCtx = (suite as any).aead.createEncryptionContext(toArrayBuffer(aeadKey));
	const pt = await aeadCtx.open(
		toArrayBuffer(aeadNonce),        // nonce
		toArrayBuffer(ct),               // ciphertext+tag
		new ArrayBuffer(0)      // AAD
	);

	return new Uint8Array(pt);
}

export const fetchKeyConfig = async (gatewayKeysUrl: string): Promise<HpkeConfig> => {
	let cfgs;
	let cfg;
	try {
		// TODO: consider moving axios fetch outside of util
		const res = await axios.get<ArrayBuffer>(gatewayKeysUrl, {
			headers: { Accept: "application/ohttp-keys" },
			responseType: "arraybuffer",
		});

		const buf = res.data; // already an ArrayBuffer
		cfgs = parseOhttpKeys(buf);
	} catch (e: any) {
		console.error(e);
		throw new Error(e.message || "Unknown error while fetching/parsing keys");
	}

	if (!cfgs || !cfgs.length) throw new Error('No key configs found')
	cfg = cfgs[0]
	if (!cfg.pairs.length) throw new Error('No symmetric alg pairs in config')

	const { kdfId, aeadId } = cfg.pairs[0] // TODO: this gets only first pair
	return {
		keyId: cfg.keyId,
		kemId: cfg.kemId,
		kdfId,
		aeadId,
		publicKey: cfg.publicKey,
		pubHex: toHex(cfg.publicKey),
	}
}

export const encryptedHttpRequest = async (relayUrl: string, keysInfo: HpkeConfig, requestParams: HttpRequestParameters) => {
	if (!keysInfo) {
		console.error("Keys Info is unset")
		return
	}
	const { keyId, kemId, kdfId, aeadId, publicKey, pubHex } = keysInfo;
	if (keyId === undefined ||
		kemId === undefined ||
		kdfId === undefined ||
		aeadId === undefined ||
		publicKey === undefined ||
		pubHex === undefined) {
		console.error("Missing field from keysInfo")
		return
	}
	const suite = buildSuite(kdfId, aeadId)
	const recip = await importGatewayPublicKey(suite, publicKey)

	const hdr = concat(
		encode1(keyId),
		encode2(kemId),
		encode2(kdfId),
		encode2(aeadId)
	);

	const info = concat(
		new TextEncoder().encode("message/bhttp request"),
		encode1(0), // single zero byte
		hdr
	);

	const sender = await suite.createSenderContext({
		recipientPublicKey: recip,
		info: toArrayBuffer(info) as ArrayBuffer
	})

	const ephemeralPublic = sender.enc;

	let body;
	if (requestParams.headers && requestParams.headers['Content-Type'] === 'application/json') { // TODO: assuming json or forms only
		console.log('parsing as json');
		body = requestParams.body ? new TextEncoder().encode(JSON.stringify(requestParams.body)) : new TextEncoder().encode('{}')
	} else {
		console.log('parsing as form');
		body = typeof requestParams?.body === 'string' ? new TextEncoder().encode(requestParams.body) : new Uint8Array(0);
	}

	const targetUrl = new URL(requestParams.url);

	const req = encodeKnownLengthRequest({
		method: requestParams.method,
		scheme: targetUrl.protocol.replace(":", ""),
		authority: targetUrl.host,
		path: targetUrl.pathname + targetUrl.search,
		headers: headersFromObject(requestParams.headers),
		body,                 // <— known-length body
		// trailers: []       // trailers are known-length too; zero-length is encoded as 0
	});
	const ct2 = await sender.seal(toArrayBuffer(req) as ArrayBuffer);

	const encapsulatedRequest = concat(
		encode1(keyId),
		encode2(kemId),
		encode2(kdfId),
		encode2(aeadId),
		new Uint8Array(ephemeralPublic),
		new Uint8Array(ct2)
	)

	const res2 = await fetch(relayUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'message/ohttp-req',
			'Authorization': 'Bearer ' + JSON.parse(sessionStorage.getItem('appToken'))
		},
		body: toArrayBuffer(encapsulatedRequest) as ArrayBuffer,
	});

	// Handle response (ciphertext of the Encapsulated Response)
	if (!res2.ok) throw new Error(`Relay HTTP ${res2.status}`);

	const responseBuffer = await res2.arrayBuffer()

	const plaintextBhttp = await decryptEncapsulatedResponse(
		suite,
		sender,
		ephemeralPublic,
		responseBuffer
	);

	const decodedResponse = decodeKnownLengthResponse(plaintextBhttp);
  //const bodyText = new TextDecoder().decode(decodedResponse.body);
	return decodedResponse;
}
