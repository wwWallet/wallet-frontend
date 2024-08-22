import * as cbor from 'cbor-web';

export function parseAuthenticatorData(bytes: Uint8Array): {
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
} {
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

function parseAttestedCredentialData(bytes: Uint8Array): [{ aaguid: Uint8Array, credentialId: Uint8Array, credentialPublicKey: { [key: number]: any } }, { [extensionId: string]: any }?] {
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

export async function importCosePublicKey(cose: cbor.Map): Promise<CryptoKey> {
	const coseKey = parseCoseKeyEc2Public(cose);
	const rawBytes = new Uint8Array([
		0x04,
		...new Uint8Array(Math.max(0, 32 - coseKey.x.length)),
		...coseKey.x,
		...new Uint8Array(Math.max(0, 32 - coseKey.y.length)),
		...coseKey.y,
	]);
	return await crypto.subtle.importKey(
		"raw",
		rawBytes,
		{ name: "ECDSA", namedCurve: "P-256" },
		true,
		["verify"],
	);
}

export function parseCoseKeyEc2Public(cose: cbor.Map): ParsedCOSEKeyEc2Public {
	const kty = cose.get(1);
	switch (kty) {

		case 2: // EC2
			const alg = cose.get(3);
			switch (alg) {

				case -7: // ES256
					const crv = cose.get(-1);
					switch (crv) {

						case 1: // P-256
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
								return { kty, alg, crv, x, y };
							} else {
								throw new Error(`Invalid COSE EC2 ES256 key: missing x or y`, { cause: { x, y } });
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
