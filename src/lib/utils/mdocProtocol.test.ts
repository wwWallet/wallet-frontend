import { assert, describe, expect, it } from "vitest";
import { cborEncode, cborDecode, DataItem } from "@auth0/mdl/lib/cbor";
import { createSessionKey, encryptMessage, decryptMessage, hexToUint8Array, deriveSharedSecret, getKey, uint8ArraytoHexString, encryptUint8Array } from "../utils/mdocProtocol";

it("can decrypt a message with a session key", async () => {
	const keyPair = await crypto.subtle.generateKey(
		{
			name: "ECDH",
			namedCurve: "P-256", // the named curve for P-256
		},
		true, // whether the key is extractable (e.g., can be exported)
		["deriveKey"] // can be used for signing and verification
	);
	const ephemeralKey = keyPair;
	const verifierKeypair = await crypto.subtle.generateKey(
		{
			name: "ECDH",
			namedCurve: "P-256",
		},
		true,
		["deriveKey"]
	);
	const walletRawPubkey = await crypto.subtle.exportKey("raw", ephemeralKey.publicKey);
	const importedWalletKey = await crypto.subtle.importKey(
		"raw",
		walletRawPubkey,
		{
			name: "ECDH",
			namedCurve: "P-256",
		},
		true,
		[]
	);
	const verifierSessionKey = await crypto.subtle.deriveKey(
		{
			name: "ECDH",
			public: importedWalletKey
		},
		verifierKeypair.privateKey,
		{
			name: "AES-GCM",
			length: 256,
		},
		false,
		["encrypt", "decrypt"]
	);
	/* ---------------------------------------------------------- */
	const verifierRawPubkey = await crypto.subtle.exportKey("raw", verifierKeypair.publicKey);

	const walletSessionKey = await createSessionKey(verifierRawPubkey, ephemeralKey);


	console.log("SESSION KEY:");
	console.log(walletSessionKey);
	const msg = "sewqew12e21ew2§w§2w2§w21w§2w§2w§2w12!weqeqe12e123123213321123";
	const { iv, ciphertext } = await encryptMessage(verifierSessionKey, msg);

	const decryptedText = await decryptMessage(walletSessionKey, iv, ciphertext);
	console.log(decryptedText);

	assert.strictEqual(decryptedText, msg);
})

it("can decrypt a message with a derviced session key (zab)", async () => {
	const keyPair = await crypto.subtle.generateKey(
		{
			name: "ECDH",
			namedCurve: "P-256", // the named curve for P-256
		},
		true, // whether the key is extractable (e.g., can be exported)
		["deriveKey", "deriveBits"] // can be used for signing and verification
	);
	const ephemeralKey = keyPair;
	const verifierKeypair = await crypto.subtle.generateKey(
		{
			name: "ECDH",
			namedCurve: "P-256",
		},
		true,
		["deriveKey", "deriveBits"]
	);
	const walletRawPubkey = await crypto.subtle.exportKey("raw", ephemeralKey.publicKey);
	const importedWalletKey = await crypto.subtle.importKey(
		"raw",
		walletRawPubkey,
		{
			name: "ECDH",
			namedCurve: "P-256",
		},
		true,
		[]
	);
	const verifierSessionKey = await crypto.subtle.deriveKey(
		{
			name: "ECDH",
			public: importedWalletKey
		},
		verifierKeypair.privateKey,
		{
			name: "AES-GCM",
			length: 256,
		},
		false,
		["encrypt", "decrypt"]
	);
	/* ---------------------------------------------------------- */

	const zab = await deriveSharedSecret(ephemeralKey.privateKey, verifierKeypair.publicKey);
	const salt = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("test").buffer);

	console.log("SHARED SECRET KEY:");
	console.log(zab);
	const SKDevice = await getKey(zab, salt, "SKDevice");
	const SKReader = await getKey(zab, salt, "SKReader");
	const msg = "sewqew12e21ew2§w§2w2§w21w§2w§2w§2w12!weqeqe12e123123213321123";
	const { iv, ciphertext } = await encryptMessage(SKReader, msg);

	const decryptedText = await decryptMessage(SKReader, iv, ciphertext);
	console.log(decryptedText);

	assert.strictEqual(decryptedText, msg);
})

it.skip('can cbor encode a data structure', () => {
	const m = {
		version: '1.0',
		documents: [new Map([
			['docType', 'unit.test.doc.type'],
		])],
		status: 0
	};

	const encoded = cborEncode(m);
	// console.log(uint8ArraytoHexString(encoded));
	expect(uint8ArraytoHexString(encoded)).toBe("b900036776657273696f6e63312e3069646f63756d656e747381a167646f635479706572756e69742e746573742e646f632e747970656673746174757300");
});

it.skip('can cbor decode a cbor structrure', () => {
	const cbor = "b900036776657273696f6e63312e3069646f63756d656e747381a167646f635479706572756e69742e746573742e646f632e747970656673746174757300";

	const decoded = cborDecode(hexToUint8Array(cbor));
	// console.log(decoded);
	expect(decoded.get('version')).toBe('1.0');
	expect(decoded.get('documents')[0].get('docType')).toBe('unit.test.doc.type');
});

it.skip('can encode, encrypt, decrypt and decode an mdoc response', async () => {
	const keyPair = await crypto.subtle.generateKey(
		{
			name: "ECDH",
			namedCurve: "P-256", // the named curve for P-256
		},
		true, // whether the key is extractable (e.g., can be exported)
		["deriveKey", "deriveBits"] // can be used for signing and verification
	);
	const ephemeralKey = keyPair;
	const verifierKeypair = await crypto.subtle.generateKey(
		{
			name: "ECDH",
			namedCurve: "P-256",
		},
		true,
		["deriveKey", "deriveBits"]
	);
	const walletRawPubkey = await crypto.subtle.exportKey("raw", ephemeralKey.publicKey);
	const importedWalletKey = await crypto.subtle.importKey(
		"raw",
		walletRawPubkey,
		{
			name: "ECDH",
			namedCurve: "P-256",
		},
		true,
		[]
	);
	const verifierSessionKey = await crypto.subtle.deriveKey(
		{
			name: "ECDH",
			public: importedWalletKey
		},
		verifierKeypair.privateKey,
		{
			name: "AES-GCM",
			length: 256,
		},
		false,
		["encrypt", "decrypt"]
	);
	/* ---------------------------------------------------------- */


	const zab = await deriveSharedSecret(ephemeralKey.privateKey, verifierKeypair.publicKey);
	const salt = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("test").buffer);

	console.log("SHARED SECRET KEY:");
	console.log(zab);
	const SKDevice = await getKey(zab, salt, "SKDevice");
	const SKReader = await getKey(zab, salt, "SKReader");


	const mdocResponseEncodedHex = "b900036776657273696f6e63312e3069646f63756d656e747381a367646f63547970657765752e6575726f70612e65632e657564692e7069642e316c6973737565725369676e6564b900026a6e616d65537061636573a17765752e6575726f70612e65632e657564692e7069642e3181d8185863a46864696765737449440271656c656d656e744964656e7469666965726a676976656e5f6e616d656c656c656d656e7456616c7565644a6f686e6672616e646f6d5820f6d3cf3743ef6adf3dadffe01d78fb8e38871d72ef2f328c1fedcbc550d422686a697373756572417574688443a10126a204582438363336616630342d353739362d346634362d613733652d64363930643764346537663318218159024830820244308201eba0030201020214110837356ec04eb13165541d45fececb361ba77d300a06082a8648ce3d0403023052310b3009060355040613024752310f300d06035504080c06477265656365310f300d06035504070c06417468656e73310e300c060355040a0c0547556e65743111300f06035504030c08777757616c6c6574301e170d3235303232363135313633335a170d3335303232343135313633335a3075310b3009060355040613024752310f300d06035504080c06477265656365310f300d06035504070c06417468656e73310e300c060355040a0c0547556e65743111300f060355040b0c084964656e746974793121301f06035504030c1857616c6c657420456e7465727072697365204973737565723059301306072a8648ce3d020106082a8648ce3d03010703420004495fc8ca046b515d8ce01d4c03e90111a6763584d64f99702666b270e27806b6c185c2f8c798293054f062e264f8dee97958277f3c0d5fa0f239ffb2779da89da37c307a30090603551d1304023000300e0603551d0f0101ff0404030205a0301d0603551d250416301406082b0601050507030106082b06010505070302301d0603551d0e04160414eead39ffdbe5d4e866ecbbf81395de19b8e0618d301f0603551d230418301680147c78f86f3cafa38ba71f2b06b7ea4d6b45ec05a2300a06082a8648ce3d040302034700304402202a0e1fd8b4a4ce9285e115f1103f533ef4b341fc7abd6d78fc324cf4bda5c83f02206a8eaed7ae9772dd2e6bf32abb73f2a05fba872550505a1055cc10ba4db8ff205903d0d8185903cbb900066776657273696f6e63312e306f646967657374416c676f726974686d675348412d3235366c76616c756544696765737473a17765752e6575726f70612e65632e657564692e7069642e31b200582079a852a8c871ab86f2f6d8a3041f9548b92619a7f7751937521edc1ecb320def015820d3672effc8569870341cfe8a52b9eea0071ea9356a6d038dce5ae272327ab681025820075c546dd1108ad73749975e861a81160c8bc3ac1e24c63c76b2e820788d5cd60358209de23a0eb09167a00806c9406042975da2b20583f9aa043521739a4469ab945e0458202f45741c2a08eb1a59e7dcd3b801a44ea7631e2f41a19550472ae1fb541018ae0558206699c28461d42d71f0c013d51f2e9eeea4d6f4ecd1238d854579fe928686c98c0658206773eca01c79c567e0292c30981c4131d16d24bdaf89ebb305376fd63f3da22e0758200733e02b0a2576e05615a8baab3512a66c2f6ea598e4cf1705c1174132d5cb9208582071c37678f2181a65ca9598d1884aa88590ab11f15453992d2a0a4bba167ce61e0958209c2204b581f2854c489bf2cbac3318adf9ef0935b05339ae3218e189ae788b220a58207b08662ddae2bc3fe39002239c99b37f0a09727d6d7ab4206d2bb04be50e0c820b582060d0bde85182d777a834fbbdc38911aa43c30b5743aa19e9dddfe8910ade49df0c5820c26f0030f44ac949348f2414bd4a6d9f2326063be846db24dd8d431f4c55eee10d582067daa753f0eb6e8a032499114584be5b5ea163ba6c73199ae180c6890bc406db0e5820837fd6e76bb082fb562ad10f346c4a8d8d2703f211bcce6898f1e15a62286c940f582076912434bfd0024df7c5686baa3b4adcee23fb7a909f63eb1f9b6fb47e8769d61058203f1ef4dea4158b9ebe352a8ff0061af6f1b1eba3ce7166e4e7f6086dc3fd9cca1158207f7700edac144dd769b6784ff2a5677f9e1749ad562448807d15af9536c7f2c56d6465766963654b6579496e666fb90001696465766963654b6579a5200104810a0102215820e0f382cc6f389aedcc88f5167d226e60bb82203b80a9a12891606bbbb34d823f225820a0739414524624fc7fbfca2a75109d0ea8d829f79229525b356056b67cafa94167646f63547970657765752e6575726f70612e65632e657564692e7069642e316c76616c6964697479496e666fb90004667369676e6564c074323032352d30332d31395431313a31333a33365a6976616c696446726f6dc074323032352d30322d32315431313a31333a33365a6a76616c6964556e74696cc074323032362d30332d31395431313a31333a33365a6e6578706563746564557064617465f758405ddfb6565b7b92de8ed1c44ac8a92a175a2a4bbf493a168984530936e9ddcb12e4b35dd1f987fd7000830d753a0dc5f2c5506726f151e694442def2766f811576c6465766963655369676e6564b900026a6e616d65537061636573d81843b900006a64657669636541757468b900016f6465766963655369676e61747572658443a10126a104f7f65840a0f2c5b2c358b671ea6f3a0781305f8f8613535c00ae6fcd1458a50fbcc4519d03f13859ecb0f7b0769c0e62de69962f0ab1fce84e25ef701efc3f71f68703206673746174757300"

	const mdocResponseEncoded = hexToUint8Array(mdocResponseEncodedHex);

	// expect(uint8ArraytoHexString(mdocResponseEncoded)).toStrictEqual(mdocResponseEncodedHex);

	const { ciphertext, iv } = (await encryptUint8Array(SKDevice, mdocResponseEncoded));
	const encryptedMdoc = ciphertext;


	const decryptedRawText = await decryptMessage(SKDevice, iv, encryptedMdoc, true) as Uint8Array;
	expect(uint8ArraytoHexString(decryptedRawText)).toStrictEqual(mdocResponseEncodedHex);

	const sessionData = {
		data: new Uint8Array(encryptedMdoc),
		// data: encryptedMdoc,
		// test: new Uint8Array([1,2,3]),
		status: 20
	}

	const sessionDataEncoded = cborEncode(sessionData);

	// Verifier Side
	const sessionDataDecoded = cborDecode(sessionDataEncoded);

	const decryptedText = await decryptMessage(SKDevice, iv, sessionDataDecoded.get("data"), true) as Uint8Array;

	// const decryptedDecodedText = cborDecode(decryptedText);
	expect(uint8ArraytoHexString(mdocResponseEncoded)).toStrictEqual(uint8ArraytoHexString(decryptedText));

	// TODO: decode assertion
});
