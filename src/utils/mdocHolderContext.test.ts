import { afterEach, describe, expect, it, vi } from "vitest";
import { exportJWK } from "jose";
import { cborDecode, Holder, IssuerSigned } from "@owf/mdoc";
import {
	createDeviceResponseForDcql,
	mdocContext,
} from "./mdocHolderContext";

const createFakeCredential = (): IssuerSigned => Object.create(IssuerSigned.prototype) as IssuerSigned;

const createParams = async (namedCurve: "P-256" | "P-384" | "P-521", alg: string, kid: string) => {
	const keyPair = await crypto.subtle.generateKey(
		{ name: "ECDSA", namedCurve },
		true,
		["sign", "verify"],
	);
	const privateKeyJwk = await exportJWK(keyPair.privateKey);
	return {
		keyPair,
		privateKeyJwk,
		params: {
		mdocCredential: { documents: [{ issuerSigned: createFakeCredential() }] },
			dcqlQuery: {
				credentials: [{ id: "mdl", meta: { doctype_value: "org.iso.18013.5.1.mDL" }, claims: [] }],
			},
			selectedCredentialId: "mdl",
			sessionTranscript: new Uint8Array([1, 2, 3]),
			privateKeyJwk,
			alg,
			kid,
		},
	};
};

describe("mdoc device signing COSE key", () => {
	afterEach(() => { vi.restoreAllMocks(); });

	it("encodes kid as a CBOR byte string and signs with the supplied key", async () => {
		const { keyPair, params } = await createParams("P-256", "ES256", "device-key-1");
		let capturedKey: any;
		vi.spyOn(Holder, "createDeviceResponseForDeviceRequest").mockImplementation(async (options) => {
			capturedKey = options.signature?.signingKey;
			return {} as any;
		});

		await createDeviceResponseForDcql(params);

		expect(capturedKey).toBeDefined();
		const encodedKey = cborDecode<Map<number, unknown>>(capturedKey.encode());
		expect(encodedKey.get(2)).toBeInstanceOf(Uint8Array);
		expect(Array.from(encodedKey.get(2) as Uint8Array)).toEqual(
			Array.from(Uint8Array.from(new TextEncoder().encode("device-key-1"))),
		);

		const payload = new TextEncoder().encode("device-authentication");
		const signature = await mdocContext.cose.sign1.sign({ key: capturedKey, toBeSigned: payload });
		const publicKey = await crypto.subtle.importKey(
			"jwk",
			await exportJWK(keyPair.publicKey),
			{ name: "ECDSA", namedCurve: "P-256" },
			false,
			["verify"],
		);
		expect(signature).toHaveLength(64);
		expect(await crypto.subtle.verify(
			{ name: "ECDSA", hash: "SHA-256" },
			publicKey,
			signature,
			payload,
		)).toBe(true);
	});

	it("does not mutate the private JWK", async () => {
		const { params } = await createParams("P-256", "ES256", "original-kid");
		const original = structuredClone(params.privateKeyJwk);
		vi.spyOn(Holder, "createDeviceResponseForDeviceRequest").mockResolvedValue({} as any);

		await createDeviceResponseForDcql(params);

		expect(params.privateKeyJwk).toEqual(original);
	});
});
