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

function credentialReducer(state: WalletStateCredential[] = [], newEvent: WalletSessionEvent) {
	switch (newEvent.type) {
		case "new_credential":
			return state.concat([{
				credentialId: newEvent.credentialId,
				data: newEvent.data,
				format: newEvent.format,
				kid: newEvent.kid,
				credentialIssuerIdentifier: newEvent.credentialIssuerIdentifier,
				credentialConfigurationId: newEvent.credentialConfigurationId,
				instanceId: newEvent.instanceId,
				batchId: newEvent.batchId,
			}]);
		case "delete_credential":
			return state.filter((cred) => cred.credentialId !== newEvent.credentialId);
		default:
			return state;
	}
}

function keypairReducer(state: WalletStateKeypair[] = [], newEvent: WalletSessionEvent) {
	switch (newEvent.type) {
		case "new_keypair":
			return state.concat([{
				kid: newEvent.kid,
				keypair: newEvent.keypair,
			}]);
		case "delete_keypair":
			return state.filter((k) => k.kid !== newEvent.kid);
		default:
			return state;
	}
}


function presentationReducer(state: WalletStatePresentation[] = [], newEvent: WalletSessionEvent) {
	switch (newEvent.type) {
		case "new_presentation":
			return state.concat([{
				presentationId: newEvent.presentationId,
				data: newEvent.data,
				usedCredentialIds: newEvent.usedCredentialIds,
				transactionId: newEvent.transactionId,
				presentationTimestampSeconds: newEvent.presentationTimestampSeconds,
				audience: newEvent.audience,
			}]);
		case "delete_presentation":
			return state.filter((k) => k.presentationId !== newEvent.presentationId);
		default:
			return state;
	}
}

function credentialIssuanceSessionReducer(state: WalletStateCredentialIssuanceSession[] = [], newEvent: WalletSessionEvent) {
	switch (newEvent.type) {
		case "save_credential_issuance_session":
			return state.filter((s) => s.sessionId !== newEvent.sessionId).concat([{
				sessionId: newEvent.sessionId,
				state: newEvent.state,
				code_verifier: newEvent.code_verifier,
				credentialConfigurationId: newEvent.credentialConfigurationId,
				credentialIssuerIdentifier: newEvent.credentialIssuerIdentifier,
				tokenResponse: newEvent.tokenResponse,
				dpop: newEvent.dpop,
				firstPartyAuthorization: newEvent.firstPartyAuthorization,
				credentialEndpoint: newEvent.credentialEndpoint,
				created: newEvent.created,
			}]);
		case "delete_credential_issuance_session":
			return state.filter((s) => s.sessionId !== newEvent.sessionId);
		default:
			return state;
	}
}

function settingsReducer(state: WalletStateSettings, newEvent: WalletSessionEvent): WalletStateSettings {
	switch (newEvent.type) {
		case "alter_settings":
			return { ...newEvent.settings };
		default:
			return state;
	}
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

	function walletStateReducer(state: WalletState, newEvent: WalletSessionEvent): WalletState {
		if (newEvent.schemaVersion === state.schemaVersion) {
			return {
				schemaVersion: newEvent.schemaVersion,
				credentials: credentialReducer(state.credentials, newEvent),
				keypairs: keypairReducer(state.keypairs, newEvent),
				presentations: presentationReducer(state.presentations, newEvent),
				credentialIssuanceSessions: credentialIssuanceSessionReducer(state.credentialIssuanceSessions, newEvent),
				settings: settingsReducer(state.settings, newEvent)
			};
		} else {
			return walletStateReducer(migrateState(state), newEvent);
		}
	}
	const v2ops = SchemaV2.createOperations(SCHEMA_VERSION, mergeStrategies);
	return {
		...v2ops,
		migrateState,
		initialWalletStateContainer,
		walletStateReducer,
	};
}

export const WalletStateOperations = createOperations(SCHEMA_VERSION, v2strats);
