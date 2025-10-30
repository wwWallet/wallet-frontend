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
	SchemaV2.WalletSessionEventNewCredential
	| SchemaV2.WalletSessionEventDeleteCredential
	| WalletSessionEventNewKeypair
	| SchemaV2.WalletSessionEventDeleteKeypair
	| SchemaV2.WalletSessionEventNewPresentation
	| SchemaV2.WalletSessionEventDeletePresentation
	| SchemaV2.WalletSessionEventAlterSettings
	| SchemaV2.WalletSessionEventSaveCredentialIssuanceSession
	| SchemaV2.WalletSessionEventDeleteCredentialIssuanceSession
);

export type WalletSessionEventNewKeypair = {
	type: "new_keypair",
	kid: string,
	keypair: CredentialKeyPair,
}

export type WalletState = Omit<SchemaV2.WalletState, "keypairs"> & {
	keypairs: {
		kid: string,
		keypair: CredentialKeyPair,
	}[],
}

export type WalletStateKeypair = WalletState['keypairs'][number];

function keypairReducer(state: WalletStateKeypair[] = [], newEvent: WalletSessionEvent): WalletStateKeypair[] {
	// Runtime logic is identical to V2. The only difference is between
	// `SchemaV2.WalletStateKeypair.keypair.wrappedPrivateKey` and
	// `SchemaV3.WalletStateKeypair.keypair.privateKey`, but the reducer logic
	// doesn't access those fields. So we can just coerce the types.
	return SchemaV2.keypairReducer(
		state as unknown as SchemaV2.WalletStateKeypair[],
		newEvent as SchemaV2.WalletSessionEvent,
	) as unknown as WalletStateKeypair[];
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
			if (newEvent.type === "new_keypair" || newEvent.type === "delete_keypair") {
				return {
					...state,
					schemaVersion: newEvent.schemaVersion,
					keypairs: keypairReducer(state.keypairs, newEvent),
				};
			} else {
				// newEvent is type narrowed here to be one of the SchemaV2 event types
				// (but with `schemaVersion: 3`), so we can use the V2 reducers natively
				return {
					...state,
					schemaVersion: newEvent.schemaVersion,
					credentials: SchemaV2.credentialReducer(state.credentials, newEvent),
					presentations: SchemaV2.presentationReducer(state.presentations, newEvent),
					credentialIssuanceSessions: SchemaV2.credentialIssuanceSessionReducer(state.credentialIssuanceSessions, newEvent),
					settings: SchemaV2.settingsReducer(state.settings, newEvent)
				};
			}
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
