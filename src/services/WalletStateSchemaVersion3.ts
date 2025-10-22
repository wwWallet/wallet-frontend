import * as WalletSchemaCommon from './WalletStateSchemaCommon';
import * as SchemaV2 from './WalletStateSchemaVersion2';
import { JWK } from 'jose';

export * from './WalletStateSchemaVersion2';


/**
	Schema version 3 changes the storage of the private keys from wrapped to unwrapped
*/
export const SCHEMA_VERSION = 3;


export type CredentialKeyPair = {
	kid: string,
	did: string,
	alg: string,
	publicKey: JWK,
	privateKey: JWK,
}

export type WalletStateContainer = {
	events: WalletSessionEvent[];
	S: WalletState;
	lastEventHash: string;
};

export type WalletSessionEvent = WalletSchemaCommon.WalletSessionEvent & WalletSessionEventTypeAttributes;

export type WalletSessionEventTypeAttributes = (
	WalletSessionEventNewCredential
	| WalletSessionEventDeleteCredential
	| WalletSessionEventNewKeypair
	| WalletSessionEventDeleteKeypair
	| WalletSessionEventNewPresentation
	| WalletSessionEventDeletePresentation
	| WalletSessionEventAlterSettings
	| WalletSessionEventSaveCredentialIssuanceSession
	| WalletSessionEventDeleteCredentialIssuanceSession
);

export type WalletSessionEventNewCredential = {
	type: "new_credential",
	credentialId: number,
	format: string,
	data: string,
	batchId: number,
	kid: string,
	instanceId: number,
	credentialIssuerIdentifier: string,
	credentialConfigurationId: string,
}

export type WalletSessionEventDeleteCredential = {
	type: "delete_credential",
	credentialId: number,
}



export type WalletSessionEventNewKeypair = {
	type: "new_keypair",
	kid: string,
	keypair: CredentialKeyPair,
}

export type WalletSessionEventDeleteKeypair = {
	type: "delete_keypair",
	kid: string,
}

export type WalletSessionEventNewPresentation = {
	type: "new_presentation",
	presentationId: number,
	transactionId: number,
	data: string,
	usedCredentialIds: number[],
	presentationTimestampSeconds: number,
	audience: string,
}

export type WalletSessionEventDeletePresentation = {
	type: "delete_presentation",
	presentationId: number,
}

export type WalletSessionEventAlterSettings = {
	type: "alter_settings",
	settings: WalletStateSettings,
}

export type WalletSessionEventSaveCredentialIssuanceSession = {
	type: "save_credential_issuance_session",
	sessionId: number,

	credentialIssuerIdentifier: string,
	state: string,
	code_verifier: string,
	credentialConfigurationId: string,
	tokenResponse?: {
		data: {
			access_token: string,
			expiration_timestamp: number,
			c_nonce: string,
			c_nonce_expiration_timestamp: number,
			refresh_token?: string,
		},
		headers: {
			"dpop-nonce"?: string,
		}
	},
	dpop?: {
		dpopJti: string,
		dpopPrivateKeyJwk: JWK,
		dpopPublicKeyJwk?: JWK,
		dpopAlg: string,
	},
	firstPartyAuthorization?: {
		auth_session: string,
	},
	credentialEndpoint?: {
		transactionId?: string,
	},
	created: number,
}

export type WalletSessionEventDeleteCredentialIssuanceSession = {
	type: "delete_credential_issuance_session",
	sessionId: number,
}

export type WalletState = {
	schemaVersion: number,
	credentials: {
		credentialId: number,
		format: string,
		data: string,
		kid: string,
		instanceId: number,
		batchId: number,
		credentialIssuerIdentifier: string,
		credentialConfigurationId: string,
	}[],
	keypairs: {
		kid: string,
		keypair: CredentialKeyPair,
	}[],
	presentations: {
		presentationId: number,
		transactionId: number, // one transaction can be associated with more than one presentations
		data: string,
		usedCredentialIds: number[],
		presentationTimestampSeconds: number,
		audience: string,
	}[],
	settings: WalletStateSettings,
	credentialIssuanceSessions: {
		sessionId: number, // unique

		credentialIssuerIdentifier: string,
		state: string,
		code_verifier: string,
		credentialConfigurationId: string,
		tokenResponse?: {
			data: {
				access_token: string,
				expiration_timestamp: number,
				c_nonce: string,
				c_nonce_expiration_timestamp: number,
				refresh_token?: string,
			},
			headers: {
				"dpop-nonce"?: string,
			}
		},
		dpop?: {
			dpopJti: string,
			dpopPrivateKeyJwk: JWK,
			dpopPublicKeyJwk?: JWK,
			dpopAlg: string,
		},
		firstPartyAuthorization?: {
			auth_session: string,
		},
		credentialEndpoint?: {
			transactionId?: string,
		},
		created: number,
	}[],
}

export type WalletStateCredential = WalletState['credentials'][number];
export type WalletStateKeypair = WalletState['keypairs'][number];
export type WalletStatePresentation = WalletState['presentations'][number];
export type WalletStateCredentialIssuanceSession = WalletState['credentialIssuanceSessions'][number];

export interface WalletStateSettings {
	openidRefreshTokenMaxAgeInSeconds: string,
	[other: string]: unknown,
}



const v2strats = SchemaV2.mergeStrategies;


export function createOperations(
	SCHEMA_VERSION: number,
	mergeStrategies: Record<WalletSessionEvent["type"], SchemaV2.MergeStrategy>,
) {

	function migrateState(state: WalletSchemaCommon.WalletState): WalletState {
		if ((state?.schemaVersion ?? 1) <= SCHEMA_VERSION) {
			return {
				...state,
				schemaVersion: SCHEMA_VERSION,
			} as unknown as WalletState;
		} else {
			throw new Error(`Cannot migrate state with schemaVersion ${state?.schemaVersion} to version ${SCHEMA_VERSION}`);
		}
	}

	function initialWalletStateContainer(): WalletStateContainer {
		return {
			S: { schemaVersion: SCHEMA_VERSION, credentials: [], presentations: [], keypairs: [], credentialIssuanceSessions: [], settings: { openidRefreshTokenMaxAgeInSeconds: '0' } },
			events: [],
			lastEventHash: "",
		}
	}
	const v2ops = SchemaV2.createOperations(SCHEMA_VERSION, mergeStrategies);
	return {
		...v2ops,
		migrateState,
		initialWalletStateContainer,
	};
}

export const WalletStateOperations = createOperations(SCHEMA_VERSION, v2strats);
