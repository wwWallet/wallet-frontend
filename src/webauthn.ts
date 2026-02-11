import * as cbor from 'cbor-web';


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
