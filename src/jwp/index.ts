// Implementation of https://www.ietf.org/archive/id/draft-ietf-jose-json-web-proof-09.html
// and https://www.ietf.org/archive/id/draft-ietf-jose-json-proof-algorithms-09.html

import { JWK } from "jose";
import { getCipherSuite } from "../bbs";
import { fromBase64Url, toBase64Url } from "../util";


/** Base64url-encoded binary string or raw binary data */
type JoseBytes = string | BufferSource;

type JwpHeader = {
	alg: string,
	kid?: string,
	typ?: string,
	crit?: string[],
	proof_key?: JWK,
	presentation_key?: JWK,
	iss?: string,
	aud?: string,
	nonce?: string | string[],
}

type IssuedJwp = {
	header: JwpHeader,
	payloads: BufferSource[],
	proof: BufferSource[],
}

type PresentedJwp = {
	presentationHeader: JwpHeader,
	issuerHeader: JwpHeader,
	payloads: (BufferSource | null)[],
	proof: BufferSource[],
}

function toBase64u(data: JoseBytes | JwpHeader): string {
	if (typeof data === 'string') {
		return data;
	} else if ("byteLength" in data) {
		if (data.byteLength === 0) {
			return '_';
		} else {
			return toBase64Url(data);
		}
	} else {
		return toBase64u(new TextEncoder().encode(JSON.stringify(data)));
	}
}

function fromBase64u(data: string): BufferSource {
	if (data === '') {
		return null;
	} else if (data === '_') {
		return new Uint8Array([]);
	} else {
		return fromBase64Url(data);
	}
}

export function parseIssuedJwp(jwp: string): {
	raw: { header: BufferSource, payloads: BufferSource[], proof: BufferSource[] },
	parsed: IssuedJwp,
} {
	const components = jwp.split(".");
	if (components.length !== 3) {
		throw new Error(`Invalid issued JWP: expected 3 .-separated components, found ${components.length}`, { cause: { jwp, components } });
	}
	const [jwpHeader, jwpPayloads, jwpProof] = components;
	const rawHeader = fromBase64u(jwpHeader);
	const payloads = jwpPayloads === '' ? [] : jwpPayloads.split("~").map(fromBase64u);
	const proof = jwpProof === '' ? [] : jwpProof.split("~").map(fromBase64u);
	return {
		raw: {
			header: rawHeader,
			payloads,
			proof,
		},
		parsed: {
			header: JSON.parse(new TextDecoder().decode(rawHeader)),
			payloads,
			proof,
		}
	};
}

export function parsePresentedJwp(jwp: string): {
	raw: { presentationHeader: BufferSource, issuerHeader: BufferSource, payloads: BufferSource[], proof: BufferSource[] },
	parsed: PresentedJwp,
} {
	const components = jwp.split(".");
	if (components.length !== 4) {
		throw new Error(`Invalid issued JWP: expected 4 .-separated components, found ${components.length}`, { cause: { jwp, components } });
	}
	const [jwpPresentationHeader, jwpIssuerHeader, jwpPayloads, jwpProof] = components;
	const rawPresentationHeader = fromBase64u(jwpPresentationHeader);
	const rawIssuerHeader = fromBase64u(jwpIssuerHeader);
	const presentationHeader = JSON.parse(new TextDecoder().decode(rawPresentationHeader));
	const issuerHeader = JSON.parse(new TextDecoder().decode(rawIssuerHeader));
	const payloads = jwpPayloads === '' ? [] : jwpPayloads.split("~").map(fromBase64u);
	const proof = jwpProof === '' ? [] : jwpProof.split("~").map(fromBase64u);
	return {
		raw: {
			presentationHeader: rawPresentationHeader,
			issuerHeader: rawIssuerHeader,
			payloads,
			proof,
		},
		parsed: {
			presentationHeader,
			issuerHeader,
			payloads,
			proof,
		},
	};
}

/** Base64url-encode (if needed) and concatenate `components` using `.` as the separator. */
function jwpConcat(...components: JoseBytes[]): string {
	return components.map(toBase64u).join(".");
}

/** Base64url-encode (if needed) and concatenate `components` using `~` as the separator. */
function jwpConcatPayloads(...components: JoseBytes[]): string {
	return components.map(toBase64u).join("~");
}

export function assembleIssuedJwp(header: JwpHeader, payloads: JoseBytes[], proof: JoseBytes[]): string {
	return jwpConcat(toBase64u(header), jwpConcatPayloads(...payloads), jwpConcatPayloads(...proof));
}

export function assemblePresentationJwp(issuedJwp: string, presentationHeader: JwpHeader, disclosedIndexes: number[], proof: JoseBytes[]): string {
	const [issuerHeader, payloads, _issuerProof] = issuedJwp.split(".");
	const disclosedSet = new Set(disclosedIndexes);
	return jwpConcat(
		toBase64u(presentationHeader),
		issuerHeader,
		jwpConcatPayloads(...payloads.split("~").map((payload, i) => disclosedSet.has(i) ? payload : '')),
		jwpConcatPayloads(...proof),
	);
}

export async function issueBbs(SK: bigint, PK: BufferSource, header: JwpHeader, payloads: BufferSource[]): Promise<string> {
	const { Sign } = getCipherSuite('BBS_BLS12381G1_XMD:SHA-256_SSWU_RO_');
	const jwpHeader = {
		...header,
		alg: 'BBS', // https://www.ietf.org/archive/id/draft-ietf-jose-json-proof-algorithms-09.html#name-bbs-using-sha-256-algorithm
	};
	const proof = await Sign(SK, PK, new TextEncoder().encode(JSON.stringify(jwpHeader)), payloads);
	return assembleIssuedJwp(header, payloads, [proof]);
}

export async function confirm(PK: BufferSource, issuedJwp: string): Promise<true> {
	const { raw: { header }, parsed: { header: { alg }, payloads, proof } } = parseIssuedJwp(issuedJwp);
	switch (alg) {
		case 'BBS':
			// https://www.ietf.org/archive/id/draft-ietf-jose-json-proof-algorithms-09.html#name-bbs-using-sha-256-algorithm
			const { Verify } = getCipherSuite('BBS_BLS12381G1_XMD:SHA-256_SSWU_RO_');
			const valid = await Verify(PK, proof[0], header, payloads);
			return valid;

		default:
			throw new Error(`Unknown JPA: ${alg}`, { cause: { jwp: issuedJwp, alg } });
	}
}

export async function presentBbs(
	PK: BufferSource,
	issuedJwp: string,
	presentationHeader: JwpHeader,
	discloseIndexes: number[],
): Promise<string> {
	const { raw: { header }, parsed: { payloads, proof: [signature] } } = parseIssuedJwp(issuedJwp);
	const { ProofGen } = getCipherSuite('BBS_BLS12381G1_XMD:SHA-256_SSWU_RO_');
	const encodedPresentationHeader = new TextEncoder().encode(JSON.stringify(presentationHeader));
	const proof = await ProofGen(
		PK,
		signature,
		header,
		encodedPresentationHeader,
		payloads,
		discloseIndexes,
	);
	return assemblePresentationJwp(issuedJwp, presentationHeader, discloseIndexes, [proof]);
}

export async function verify(PK: BufferSource, presentedJwp: string): Promise<true> {
	const {
		raw: { presentationHeader, issuerHeader },
		parsed: { issuerHeader: { alg }, payloads, proof },
	} = parsePresentedJwp(presentedJwp);
	switch (alg) {
		case 'BBS':
			// https://www.ietf.org/archive/id/draft-ietf-jose-json-proof-algorithms-09.html#name-bbs-using-sha-256-algorithm
			const { ProofVerify } = getCipherSuite('BBS_BLS12381G1_XMD:SHA-256_SSWU_RO_');
			const valid = await ProofVerify(
				PK,
				proof[0],
				issuerHeader,
				presentationHeader,
				payloads.filter(p => p !== null),
				payloads.map((p, i) => p === null ? null : i).filter(i => i !== null),
			);
			return valid;

		default:
			throw new Error(`Unknown JPA: ${alg}`, { cause: { jwp: presentedJwp, alg } });
	}
}
