import { UserId } from '../api/types';
import * as config from '../config';

export function getRpId(): string {
	return config.WEBAUTHN_RPID;
}

export function makeCreateOptions({
	challenge,
	user,
}: {
	challenge: ArrayBuffer,
	prfSalt?: ArrayBuffer,
	user: {
		uuid: UserId,
		name: string,
		displayName: string,
		webauthnCredentials?: any[],
	},
}) {
	return {
		publicKey: {
			rp: {
				id: getRpId(),
				name: 'wwWallet',
			},
			user: {
				id: user.uuid.asUserHandle(),
				name: user.name,
				displayName: user.displayName,
			},
			challenge: challenge,
			pubKeyCredParams: [
				{ type: "public-key", alg: -7 },
				{ type: "public-key", alg: -8 },
				{ type: "public-key", alg: -257 },
			],
			excludeCredentials: [],
			authenticatorSelection: {
				requireResidentKey: true,
				residentKey: "required",
				userVerification: "required",
			},
			attestation:'direct',
			extensions: {
				credProps: true,
				prf: {},
			},
		},
	};
}

export function makeGetOptions({
	challenge,
	user,
}: {
	challenge: ArrayBuffer,
	user?: {
		webauthnCredentials: any[],
	},
}) {
	return {
		publicKey: {
			rpId: getRpId(),
			challenge: challenge,
			allowCredentials: [],
			userVerification: "required",
		},
	};
}
