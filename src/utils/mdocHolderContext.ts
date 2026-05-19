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
			verify: async () => {
				throw new Error("cose.sign1.verify is not used in holder flow");
			},
		},
	},
} satisfies Pick<MdocContext, "crypto" | "cose">;

function selectDcqlCredential(dcqlQuery: any, selectedCredentialId?: string): any {
	const credentials = Array.isArray(dcqlQuery?.credentials) ? dcqlQuery.credentials : [];
	if (credentials.length === 0) {
		throw new Error("Missing credentials in dcql_query");
	}
	if (selectedCredentialId) {
		const selected = credentials.find((credential: any) => credential?.id === selectedCredentialId);
		if (!selected) {
			throw new Error(`Missing credential in dcql_query for id '${selectedCredentialId}'`);
		}
		return selected;
	}
	if (credentials.length !== 1) {
		throw new Error("selectedCredentialId is required when dcql_query has multiple credentials");
	}
	return credentials[0];
}

export function toDeviceRequestFromDcql(dcqlQuery: any, selectedCredentialId?: string): DeviceRequest {
	const credential = selectDcqlCredential(dcqlQuery, selectedCredentialId);
	const claims = Array.isArray(credential?.claims) ? credential.claims : [];
	const docType = credential?.meta?.doctype_value;
	if (!docType || typeof docType !== "string") {
		throw new Error("Could not determine mdoc docType from dcql_query.meta.doctype_value");
	}

	const namespaces: Record<string, Record<string, boolean>> = {};
	for (const claim of claims) {
		const path = Array.isArray(claim?.path) ? claim.path : [];
		if (path.length < 2 || typeof path[0] !== "string" || typeof path[1] !== "string") {
			continue;
		}
		const namespace = path[0];
		const elementIdentifier = path[1];
		namespaces[namespace] ??= {};
		namespaces[namespace][elementIdentifier] = Boolean(claim?.intent_to_retain);
	}

	const itemsRequest = ItemsRequest.create({
		docType,
		namespaces: Object.keys(namespaces).length > 0 ? namespaces : { [docType]: {} },
	});
	return DeviceRequest.create({ docRequests: [DocRequest.create({ itemsRequest })] });
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

export async function createDeviceResponseForDcql(params: {
	mdocCredential: MDoc;
	dcqlQuery: any;
	selectedCredentialId?: string;
	sessionTranscript: Uint8Array;
	privateKeyJwk: JWK;
	alg: string;
	kid: string;
}): Promise<MDoc> {
	const deviceRequest = toDeviceRequestFromDcql(params.dcqlQuery, params.selectedCredentialId);
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
