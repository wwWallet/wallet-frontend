import { cborEncode, getCborEncodeDecodeOptions, setCborEncodeDecodeOptions } from "@auth0/mdl/lib/cbor";
import { DataItem } from "@auth0/mdl";

export async function createSessionKey(rawPublic: ArrayBuffer, ephemeralKey: CryptoKeyPair) : Promise<CryptoKey> {
	const importedVerifierPublicKey = await crypto.subtle.importKey(
		"raw",
		rawPublic,
		{
			name: "ECDH",
			namedCurve: "P-256",
		},
		true,
		[]
	);

	const sessionKey = await crypto.subtle.deriveKey(
		{
			name: "ECDH",
			public: importedVerifierPublicKey
		},
		ephemeralKey.privateKey,
		{
			name: "AES-GCM",
			length: 256,
		},
		false,
		["encrypt", "decrypt"]
	);

	return sessionKey;
}

export async function encryptMessage(sessionKey, plaintext, iv=null) {
	// const enc = new TextEncoder();
	if (!iv) {
		iv = crypto.getRandomValues(new Uint8Array(12));
	} else {
		console.log('using iv:');
		console.log(iv);
	}

	const ciphertext = await crypto.subtle.encrypt(
		{
			name: "AES-GCM",
			iv: iv
		},
		sessionKey,
		// enc.encode(plaintext)
		// plaintext
		new TextEncoder().encode(plaintext).buffer
	);

	return { iv, ciphertext };
}

export async function encryptUint8Array(sessionKey, arr, iv=null) {
	// const enc = new TextEncoder();
	if (!iv) {
		iv = crypto.getRandomValues(new Uint8Array(12));
	} else {
		console.log('using iv:');
		console.log(iv);
	}

	const ciphertext = await crypto.subtle.encrypt(
		{
			name: "AES-GCM",
			iv: iv
		},
		sessionKey,
		// enc.encode(plaintext)
		// plaintext
		arr
	);

	return { iv, ciphertext };
}

export async function decryptMessage(sessionKey, iv, ciphertext, uint8 = false) {
	const dec = new TextDecoder();

	const plaintext = await crypto.subtle.decrypt(
		{
			name: "AES-GCM",
			iv: iv
		},
		sessionKey,
		ciphertext
	);
	if (uint8) {
		return new Uint8Array(plaintext);
	} else {
		return dec.decode(plaintext);
	}
}

export function hexToUint8Array(hexString) {
	return Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
}

export function uint8ArrayToBase64Url(array: any) {
	// Convert the Uint8Array to a binary string
	let binaryString = '';
	array.forEach((byte: any) => {
		binaryString += String.fromCharCode(byte);
	});

	// Convert the binary string to a Base64 string
	let base64String = btoa(binaryString);

	// Convert the Base64 string to Base64URL format
	let base64UrlString = base64String
		.replace(/\+/g, '-') // Replace + with -
		.replace(/\//g, '_') // Replace / with _
		.replace(/=+$/, ''); // Remove trailing '='

	return base64UrlString;
}

export function uint8ArraytoHexString(byteArray: Uint8Array): string {
	return Array.from(byteArray, (byte: number) =>
		('0' + (byte & 0xFF).toString(16)).slice(-2)
	).join('');
}

export async function deriveSKReader(sessionTranscriptBytes) {

}

/*
		Source: https://github.com/mdn/dom-examples/blob/main/web-crypto/derive-key/hkdf.js
		Derive a shared secret, given:
		- our ECDH private key
		- their ECDH public key
*/
export async function deriveSharedSecret(privateKey, publicKey) {
	const secret = await crypto.subtle.deriveBits(
		{ name: "ECDH", public: publicKey },
		privateKey,
		256
	);

	return crypto.subtle.importKey(
		"raw",
		secret,
		{ name: "HKDF" },
		false,
		["deriveKey"]
	);
}

export async function getKey(keyMaterial, salt, info) {
	return await crypto.subtle.deriveKey(
		{
			name: "HKDF",
			salt: salt,
			info: new TextEncoder().encode(info).buffer,
			hash: "SHA-256",
		},
		keyMaterial,
		{ name: "AES-GCM", length: 256 },
		true,
		["encrypt", "decrypt"]
	);
}

export function getSessionTranscriptBytes(deviceEngagementBytes, eReaderKeyBytes) {
	const options = getCborEncodeDecodeOptions();
	options.variableMapSize = true;
	setCborEncodeDecodeOptions(options);
	return cborEncode(DataItem.fromData([
		deviceEngagementBytes, // DeviceEngagementBytes
		eReaderKeyBytes, // EReaderKeyBytes
		null,
	]));
}

export function getDeviceEngagement(uuid: string, publicKeyJWK: JsonWebKey) {
	const bleOptions = new Map<number, any>([
		[0, false],
		[1, true],
		[11, uuidToUint8Array(uuid)],
	]);

	const themap = new Map<number, any>();
	themap.set(0, "1.0");
	//@ts-ignore
	themap.set(1, [1, DataItem.fromData(new Map([[1, 2], [-1, 1],

	[-2, base64urlToUint8Array(publicKeyJWK.x)],
	[-3, base64urlToUint8Array(publicKeyJWK.y)]]))])
	themap.set(2, [[2, 1, bleOptions]]);

	return themap;
}

export function uuidToUint8Array(uuid) {
	// Remove hyphens from the UUID string
	const hexString = uuid.replace(/-/g, '');

	// Create a Uint8Array with a length of 16 bytes (128 bits)
	const byteArray = new Uint8Array(16);

	// Fill the byte array with values by parsing the hex pairs
	for (let i = 0; i < 16; i++) {
		byteArray[i] = parseInt(hexString.slice(i * 2, i * 2 + 2), 16);
	}

	return byteArray;
}

export function base64urlToUint8Array(base64url: string): Uint8Array {
	const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/'); // Base64url to Base64
	const binaryString = atob(base64);  // Decode base64 to binary string
	const byteArray = new Uint8Array(binaryString.length); // Create a Uint8Array of the same length

	// Populate the Uint8Array with byte values
	for (let i = 0; i < binaryString.length; i++) {
		byteArray[i] = binaryString.charCodeAt(i);
	}

	return byteArray;
}
