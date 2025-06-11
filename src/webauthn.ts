import * as cbor from 'cbor-web';
import { COSE_ALG_ARKG_P256, COSE_ALG_ESP256_ARKG, COSE_KTY_ARKG_DERIVED, COSE_KTY_ARKG_PUB } from './coseConstants';


export type ParsedCOSEKey = {
	kty: number | string,
	kid?: Uint8Array,
	alg?: COSEAlgorithmIdentifier,
	[name: string]: any,
};

export type ParsedCOSEKeyEc2Public = ParsedCOSEKey & {
	kty: 2,
	kid?: Uint8Array,
	alg?: COSEAlgorithmIdentifier,
	crv: number,
	x: Uint8Array,
	y: Uint8Array,
};

export type ParsedCOSEKeyArkgPubSeed = ParsedCOSEKey & {
	kty: COSE_KTY_ARKG_PUB,
	alg: COSEAlgorithmIdentifier,
	pkBl: ParsedCOSEKey,
	pkKem: ParsedCOSEKey,
};

export type ParsedCOSEKeyRef = {
	kty: number | string,
	kid: Uint8Array,
	alg?: COSEAlgorithmIdentifier,
	[name: string]: any,
};

export type ParsedCOSEKeyRefArkgDerivedBase = ParsedCOSEKeyRef & {
	kty: COSE_KTY_ARKG_DERIVED,
};

export type ParsedCOSEKeyRefArkgDerived = ParsedCOSEKeyRefArkgDerivedBase & {
	kh: Uint8Array,
	info: Uint8Array,
}

export type AuthenticatorData = {
	rpIdHash: Uint8Array,
	flags: {
		UP: boolean,
		UV: boolean,
		BE: boolean,
		BS: boolean,
		AT: boolean,
		ED: boolean,
	},
	signCount: number,
	attestedCredentialData?: { aaguid: Uint8Array, credentialId: Uint8Array, credentialPublicKey: { [key: number]: any } },
	extensions?: { [extensionId: string]: any },
}

export type WebauthnInteractionEvent = (
	{ id: 'intro', chosenCredentialId: BufferSource }
	| { id: 'webauthn-begin', webauthnArgs: CredentialRequestOptions }
	| { id: 'err', err: unknown, credential?: PublicKeyCredential, authData?: AuthenticatorData }
	| { id: 'err:ext:sign:signature-not-found', credential: PublicKeyCredential, authData: AuthenticatorData }
	| { id: 'success' }
	| { id: 'success:dismiss' }
);
export type WebauthnInteractionEventResponse = (
	{ id: 'intro:ok' }
	| { id: 'webauthn-begin:ok', credential: PublicKeyCredential }
	| { id: 'cancel', cause?: unknown }
	| { id: 'retry' }
	| { id: 'success:ok' }
);


export function parseAuthenticatorData(bytes: Uint8Array): AuthenticatorData {
	const rpIdHash = bytes.slice(0, 32);
	const flagsByte = bytes[32]; // eslint-disable-line prefer-destructuring
	const signCount = new DataView(bytes.buffer).getUint32(32 + 1, false);

	const flags = {
		UP: (flagsByte & 0x01) !== 0,
		UV: (flagsByte & 0x04) !== 0,
		BE: (flagsByte & 0x08) !== 0,
		BS: (flagsByte & 0x10) !== 0,
		AT: (flagsByte & 0x40) !== 0,
		ED: (flagsByte & 0x80) !== 0,
	};

	if (flags.AT) {
		const [attestedCredentialData, extensions] = parseAttestedCredentialData(bytes.slice(32 + 1 + 4));
		if (Boolean(extensions) !== flags.ED) {
			throw new Error(`Extensions (present: ${extensions !== null}) do not match ED flag (${flags.ED})`);
		}
		return {
			rpIdHash,
			flags,
			signCount,
			attestedCredentialData,
			...(extensions ? { extensions } : {}),
		};
	} else {
		if (flags.ED !== (bytes.length > 32 + 1 + 4)) {
			throw new Error(`Extensions (present: ${bytes.length > 32 + 1 + 4}) do not match ED flag (${flags.ED})`);
		}
		if (flags.ED) {
			const [extensions] = cbor.decodeAllSync(bytes.slice(32 + 1 + 4));
			return {
				rpIdHash,
				flags,
				signCount,
				extensions,
			};
		} else {
			return {
				rpIdHash,
				flags,
				signCount,
			};
		}
	}
}

function parseAttestedCredentialData(bytes: Uint8Array): [
	{ aaguid: Uint8Array, credentialId: Uint8Array, credentialPublicKey: { [key: number]: any } },
	{ [extensionId: string]: any }?,
] {
	const aaguid = bytes.slice(0, 16);
	const credentialIdLength = new DataView(bytes.buffer).getUint16(16, false);
	const credentialId = bytes.slice(16 + 2, 16 + 2 + credentialIdLength);
	const [credentialPublicKey, extensions] = cbor.decodeAllSync(bytes.slice(16 + 2 + credentialIdLength));
	return [
		{
			aaguid,
			credentialId,
			credentialPublicKey,
		},
		extensions,
	];
}

export function getAuthenticatorExtensionOutputs(credential: PublicKeyCredential): { [extensionId: string]: any } {
	const authenticatorData = (
		"authenticatorData" in credential.response
			? credential.response.authenticatorData
			: ("attestationObject" in credential.response
				? cbor.decodeFirstSync(credential.response.attestationObject)["authData"]
				: null
			)
	);
	if (authenticatorData === null) {
		throw new Error(`Failed to get authenticator data from credential: ${credential}`, { cause: { credential } });
	}

	return parseAuthenticatorData(authenticatorData).extensions;
}

export async function importCosePublicKey(cose: cbor.Map): Promise<CryptoKey> {
	const coseKey = parseCoseKeyEc2Public(cose);
	const [algorithm, keyUsages] = getEcKeyImportParams(coseKey);
	const rawBytes = new Uint8Array([
		0x04,
		...new Uint8Array(Math.max(0, 32 - coseKey.x.length)),
		...coseKey.x,
		...new Uint8Array(Math.max(0, 32 - coseKey.y.length)),
		...coseKey.y,
	]);
	return await crypto.subtle.importKey("raw", rawBytes, algorithm, true, keyUsages);
}

function getEcKeyImportParams(cose: ParsedCOSEKeyEc2Public): [EcKeyImportParams, KeyUsage[]] {
	const { alg, crv } = cose;
	switch (alg) {
		case -7: // ES256
			switch (crv) {
				case 1: // P-256
					return [{ name: "ECDSA", namedCurve: "P-256" }, ["verify"]];
				default:
					throw new Error(`Unsupported COSE elliptic curve: ${crv}`, { cause: { crv } })
			}

		case -25: // ECDH-ES + HKDF-256
			switch (crv) {
				case 1: // P-256
					return [{ name: "ECDH", namedCurve: "P-256" }, ["deriveBits", "deriveKey"]];

				default:
					throw new Error(`Unsupported COSE elliptic curve: ${crv}`, { cause: { crv } })
			}

		default:
			throw new Error(`Unsupported COSE algorithm: ${alg}`, { cause: { alg } })
	}
}

function getCoseCurveCoordinateByteLength(crv: number): number {
	switch (crv) {
		case 1: // P-256
			return 32;

		case -65601: // BLS12-381 (placeholder value)
			return 48;

		default:
			throw new Error(`Unsupported COSE elliptic curve: ${crv}`, { cause: { crv } })
	}
}

export function parseCoseKey(cose: cbor.Map): ParsedCOSEKeyEc2Public | ParsedCOSEKeyArkgPubSeed {
	const kty = cose.get(1);
	switch (kty) {
		case 2: // EC2
			return parseCoseKeyEc2Public(cose);

		case COSE_KTY_ARKG_PUB:
			return parseCoseKeyArkgPubSeed(cose);

		default:
			throw new Error(`Unsupported COSE key type: ${kty}`, { cause: { kty } });
	}
}

export function parseCoseKeyEc2Public(cose: cbor.Map): ParsedCOSEKeyEc2Public {
	const kty = cose.get(1);
	switch (kty) {

		case 2: // EC2
			const alg = cose.get(3);
			switch (alg) {

				case -7: // ES256
				case -9: // ESP256
				case -25: // ECDH-ES w/ HKDF
				case -65602: // Modified split-BBS with SHA-256 (placeholder value)
					const crv = cose.get(-1);
					const expectLen = getCoseCurveCoordinateByteLength(crv);
					switch (crv) {

						case 1: // P-256
						case -65601: // BLS12-381 (placeholder value)
							const x = cose.get(-2);
							const y = cose.get(-3);
							if (x && y) {
								if (!(x instanceof Uint8Array)) {
									throw new Error(
										`Incorrect type of "x (-2)" attribute of EC2 COSE_Key: ${typeof x} ${x}`,
										{ cause: { x } },
									);
								}
								if (!(y instanceof Uint8Array)) {
									throw new Error(
										`Incorrect type of "y (-3)" attribute of EC2 COSE_Key: ${typeof y} ${y}`,
										{ cause: { y } },
									);
								}
								if (x.length !== expectLen) {
									throw new Error(
										`Incorrect length of "x (-2)" attribute of EC2 COSE_Key: expected ${expectLen} bytes, got ${x.length} bytes`,
										{ cause: { x } },
									);
								}
								if (y.length !== expectLen) {
									throw new Error(
										`Incorrect length of "y (-3)" attribute of EC2 COSE_Key: expected ${expectLen} bytes, got ${y.length} bytes`,
										{ cause: { y } },
									);
								}
								return { kty, alg, crv, x, y };
							} else {
								throw new Error(`Invalid COSE EC2 ES256, ECDH or Split-BBS key: missing x or y`, { cause: { x, y } });
							}

						default:
							throw new Error(`Unsupported COSE elliptic curve: ${crv}`, { cause: { crv } })
					}

				default:
					throw new Error(`Unsupported COSE algorithm: ${alg}`, { cause: { alg } })
			}

		default:
			throw new Error(`Unsupported COSE key type: ${kty}`, { cause: { kty } });
	}
}

export function parseCoseKeyArkgPubSeed(cose: cbor.Map): ParsedCOSEKeyArkgPubSeed {
	const kty = cose.get(1);
	switch (kty) {
		case COSE_KTY_ARKG_PUB:
			const kid = cose.get(2);
			if (!(kid instanceof Uint8Array)) {
				throw new Error(
					`Incorrect type of "kid (2)" attribute of ARKG-pub COSE_Key: ${typeof kid} ${kid}`,
					{ cause: { kid } },
				);
			}

			let alg = cose.get(3);
			switch (alg) {
				case COSE_ALG_ESP256_ARKG:
					console.warn(`WARNING: Wrong alg (3) value in ARKG-pub COSE_Key: ${alg}; should probably be ${COSE_ALG_ARKG_P256}`);
					alg = COSE_ALG_ARKG_P256;
					break;

				case COSE_ALG_ARKG_P256:
					// OK; do nothing
					break;

				default:
					throw new Error("Unsupported alg (3) in ARKG-pub COSE_Key: " + alg)
			}

			const pkBl = parseCoseKeyEc2Public(cose.get(-1));
			const pkKem = parseCoseKeyEc2Public(cose.get(-2));
			return { kty, kid, pkBl, pkKem, alg };

		default:
			throw new Error(`Unsupported COSE key type: ${kty}`, { cause: { kty } });
	}
}

export function encodeCoseKeyRefArkgDerived(keyRef: ParsedCOSEKeyRefArkgDerived): ArrayBuffer {
	return new Uint8Array(cbor.encodeCanonical(new cbor.Map([ // Can't use object literal because that turns integer keys into strings
		[1, keyRef.kty],
		[2, keyRef.kid.buffer],
		[3, keyRef.alg],
		[-1, keyRef.kh.buffer],
		[-2, keyRef.info.buffer],
	]))).buffer;
}
