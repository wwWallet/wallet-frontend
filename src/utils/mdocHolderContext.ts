import { JWK } from "jose";
import { p256, p384, p521 } from "@noble/curves/nist.js";
import {
	cborEncode,
	CoseKey,
	DeviceRequest,
	DocRequest,
	Holder,
	ItemsRequest,
	IssuerSigned,
	type DeviceResponse,
	type MdocContext,
} from "@owf/mdoc";

export type MDoc = DeviceResponse | {
	documents?: any[];
	encode?: () => Uint8Array;
};

type EcdsaProfile = {
	namedCurve: "P-256" | "P-384" | "P-521";
	hash: "SHA-256" | "SHA-384" | "SHA-512";
	compactSignatureSize: number;
};

function getEcdsaProfileFromJwk(jwk: JsonWebKey): EcdsaProfile {
	if (jwk.crv === "P-384" || jwk.alg === "ES384") {
		return { namedCurve: "P-384", hash: "SHA-384", compactSignatureSize: 96 };
	}
	if (jwk.crv === "P-521" || jwk.alg === "ES512") {
		return { namedCurve: "P-521", hash: "SHA-512", compactSignatureSize: 132 };
	}
	return { namedCurve: "P-256", hash: "SHA-256", compactSignatureSize: 64 };
}

function convertDerToCompact(signature: Uint8Array, profile: EcdsaProfile): Uint8Array {
	if (profile.namedCurve === "P-384") {
		return p384.Signature.fromBytes(signature, "der").toBytes("compact");
	}
	if (profile.namedCurve === "P-521") {
		return p521.Signature.fromBytes(signature, "der").toBytes("compact");
	}
	return p256.Signature.fromBytes(signature, "der").toBytes("compact");
}

function convertCompactToDer(signature: Uint8Array, profile: EcdsaProfile): Uint8Array {
	if (profile.namedCurve === "P-384") {
		return p384.Signature.fromBytes(signature, "compact").toBytes("der");
	}
	if (profile.namedCurve === "P-521") {
		return p521.Signature.fromBytes(signature, "compact").toBytes("der");
	}
	return p256.Signature.fromBytes(signature, "compact").toBytes("der");
}

async function importSigningKeyFromCoseKey(key: CoseKey): Promise<CryptoKey> {
	const jwk = key.jwk as JsonWebKey;
	const { namedCurve } = getEcdsaProfileFromJwk(jwk);
	return await crypto.subtle.importKey(
		"jwk",
		jwk,
		{ name: "ECDSA", namedCurve },
		false,
		["sign"]
	);
}

async function importVerifyKeyFromCoseKey(key: CoseKey): Promise<CryptoKey> {
	const jwk = key.jwk as JsonWebKey;
	const { namedCurve } = getEcdsaProfileFromJwk(jwk);
	const publicJwk: JsonWebKey = { ...jwk, d: undefined };
	return await crypto.subtle.importKey(
		"jwk",
		publicJwk,
		{ name: "ECDSA", namedCurve },
		false,
		["verify"]
	);
}

export const mdocContext = {
	crypto: {
		digest: async ({ digestAlgorithm, bytes }) => {
			const digest = await crypto.subtle.digest(digestAlgorithm, bytes as Uint8Array<ArrayBuffer>);
			return new Uint8Array(digest);
		},
		random: (length: number) => crypto.getRandomValues(new Uint8Array(length)),
		calculateEphemeralMacKey: async () => {
			throw new Error("calculateEphemeralMacKey is not used in holder flow");
		},
	},
	cose: {
		mac0: {
			sign: async () => {
				throw new Error("mac0.sign is not used in holder flow");
			},
			verify: async () => {
				throw new Error("mac0.verify is not used in holder flow");
			},
		},
		sign1: {
			sign: async ({ key, toBeSigned }) => {
				const jwk = key.jwk as JsonWebKey;
				const { hash, compactSignatureSize } = getEcdsaProfileFromJwk(jwk);
				const signingKey = await importSigningKeyFromCoseKey(key);
				const signature = new Uint8Array(await crypto.subtle.sign(
					{ name: "ECDSA", hash },
					signingKey,
					toBeSigned as BufferSource
				));
				if (signature.length === compactSignatureSize) {
					return signature;
				}
				try {
					return convertDerToCompact(signature, getEcdsaProfileFromJwk(jwk));
				} catch {
					throw new Error(`Unsupported ECDSA signature encoding from WebCrypto (length=${signature.length})`);
				}
			},
			verify: async ({ sign1, key }) => {
				const jwk = key.jwk as JsonWebKey;
				const { hash, compactSignatureSize } = getEcdsaProfileFromJwk(jwk);
				const verifyKey = await importVerifyKeyFromCoseKey(key);
				const signature = sign1.signature as Uint8Array;
				const signatureForVerify = signature.length === compactSignatureSize
					? convertCompactToDer(signature, getEcdsaProfileFromJwk(jwk))
					: signature;
				return await crypto.subtle.verify(
					{ name: "ECDSA", hash },
					verifyKey,
					signatureForVerify as BufferSource,
					sign1.toBeSigned as BufferSource
				);
			},
		},
	},
} satisfies Pick<MdocContext, "crypto" | "cose">;

export function toDeviceRequestFromPresentationDefinition(presentationDefinition: any): DeviceRequest {
	const inputDescriptors = Array.isArray(presentationDefinition?.input_descriptors)
		? presentationDefinition.input_descriptors
		: [];
	if (inputDescriptors.length === 0) {
		throw new Error("Missing input_descriptors in presentation definition");
	}

	const docRequests = inputDescriptors.map((descriptor: any) => {
		const docType = descriptor?.id;
		if (!docType) {
			throw new Error("Input descriptor is missing id");
		}

		const fields = Array.isArray(descriptor?.constraints?.fields) ? descriptor.constraints.fields : [];
		const namespaces: Record<string, Record<string, boolean>> = {};
		for (const field of fields) {
			const intentToRetain = Boolean(field?.intent_to_retain);
			const paths = Array.isArray(field?.path) ? field.path : [];
			let foundPath = false;

			for (const path of paths) {
				const match = /^\$\['([^']+)'\]\['([^']+)'\]$/.exec(path);
				if (!match) {
					continue;
				}
				foundPath = true;
				const namespace = match[1];
				const elementIdentifier = match[2];
				namespaces[namespace] ??= {};
				namespaces[namespace][elementIdentifier] = intentToRetain;
			}

			if (!foundPath && field?.name) {
				namespaces[docType] ??= {};
				namespaces[docType][field.name] = intentToRetain;
			}
		}

		const itemsRequest = ItemsRequest.create({
			docType,
			namespaces: Object.keys(namespaces).length > 0 ? namespaces : { [docType]: {} },
		});
		return DocRequest.create({ itemsRequest });
	});

	return DeviceRequest.create({ docRequests });
}

export function getIssuerSignedFromMdoc(mdocCredential: MDoc): IssuerSigned {
	const issuerSigned = (mdocCredential as any)?.documents?.[0]?.issuerSigned;
	if (!issuerSigned) {
		throw new Error("Unsupported mdoc credential shape");
	}
	if (issuerSigned instanceof IssuerSigned) {
		return issuerSigned;
	}
	if (typeof issuerSigned?.encode === "function") {
		return IssuerSigned.decode(issuerSigned.encode());
	}
	return IssuerSigned.decode(cborEncode(issuerSigned));
}

export function extractDevicePublicKeyJwkFromMdoc(mdocCredential: MDoc): JWK {
	return getIssuerSignedFromMdoc(mdocCredential).issuerAuth.mobileSecurityObject.deviceKeyInfo.deviceKey.jwk as JWK;
}

export async function createDeviceResponseForPresentationDefinition(params: {
	mdocCredential: MDoc;
	presentationDefinition: any;
	sessionTranscript: Uint8Array;
	privateKeyJwk: JWK;
	alg: string;
	kid: string;
}): Promise<MDoc> {
	const deviceRequest = toDeviceRequestFromPresentationDefinition(params.presentationDefinition);
	const issuerSigned = getIssuerSignedFromMdoc(params.mdocCredential);
	return await Holder.createDeviceResponseForDeviceRequest(
		{
			deviceRequest,
			sessionTranscript: params.sessionTranscript,
			issuerSigned: [issuerSigned],
			signature: {
				signingKey: CoseKey.fromJwk({
					...params.privateKeyJwk,
					alg: params.alg,
					kid: params.kid,
				} as Record<string, unknown>),
			},
		},
		mdocContext
	);
}
