import * as WalletSchemaCommon from './WalletStateSchemaCommon';
import * as SchemaV3 from './WalletStateSchemaVersion3';

export * from './WalletStateSchemaVersion3';

/** Schema version 4 persists the WIA alongside its issuance session. */
export const SCHEMA_VERSION = 4;

export type WalletStateCredentialIssuanceSession = SchemaV3.WalletStateCredentialIssuanceSession & {
	walletInstanceAttestation?: string,
};
export type WalletSessionEventSaveCredentialIssuanceSession = SchemaV3.WalletSessionEventSaveCredentialIssuanceSession & {
	walletInstanceAttestation?: string,
};
export type WalletSessionEventTypeAttributes = Exclude<SchemaV3.WalletSessionEventTypeAttributes, { type: "save_credential_issuance_session" }>
	| WalletSessionEventSaveCredentialIssuanceSession;
export type WalletSessionEventV4 = WalletSchemaCommon.WalletSessionEvent & WalletSessionEventTypeAttributes;
export type WalletSessionEvent = SchemaV3.WalletSessionEvent | WalletSessionEventV4;
export type WalletStateV4 = Omit<SchemaV3.WalletState, "credentialIssuanceSessions"> & {
	credentialIssuanceSessions: WalletStateCredentialIssuanceSession[],
};
export type WalletStateV4OrEarlier = SchemaV3.WalletStateV3OrEarlier | WalletStateV4;
export type WalletState = WalletStateV4;
export type WalletStateContainer = {
	events: WalletSessionEvent[];
	S: WalletStateV4OrEarlier;
	lastEventHash: string;
};

export function createOperations(
	schemaVersion: number,
	mergeStrategies: Record<WalletSessionEvent["type"], SchemaV3.MergeStrategy>,
) {
	const previousOperations = SchemaV3.createOperations(schemaVersion, mergeStrategies);

	function migrateState(state: WalletStateV4OrEarlier): WalletState {
		if (state.schemaVersion === schemaVersion) {
			return state as WalletState
		};
		if ((state.schemaVersion ?? 1) < schemaVersion) {
			return { ...SchemaV3.WalletStateOperations.migrateState(state), schemaVersion };
		}
		throw new Error(`Cannot migrate state with schemaVersion ${state.schemaVersion} to version ${schemaVersion}`);
	}

	function walletStateReducer(state: WalletStateV4OrEarlier, event: WalletSessionEvent): WalletStateV4OrEarlier {
		if (event.schemaVersion === schemaVersion) {
			const migrated = migrateState(state);
			if (event.type === "save_credential_issuance_session") {
				const session: WalletStateCredentialIssuanceSession = {
					sessionId: event.sessionId,
					credentialIssuerIdentifier: event.credentialIssuerIdentifier,
					state: event.state,
					code_verifier: event.code_verifier,
					credentialConfigurationId: event.credentialConfigurationId,
					tokenResponse: event.tokenResponse,
					dpop: event.dpop,
					firstPartyAuthorization: event.firstPartyAuthorization,
					credentialEndpoint: event.credentialEndpoint,
					created: event.created,
					walletInstanceAttestation: 'walletInstanceAttestation' in event ? event.walletInstanceAttestation : undefined,
				};
				return {
					...migrated,
					credentialIssuanceSessions: migrated.credentialIssuanceSessions
						.filter(existing => existing.sessionId !== event.sessionId)
						.concat([session]),
				};
			}
			// Handle keypairs directly so V3 keys never pass through V2 types.
			if (event.type === "new_keypair") {
				if (!("privateKey" in event.keypair)) {
					throw new Error("Version 4 keypair events require an unwrapped private key");
				}
				return {
					...migrated,
					keypairs: migrated.keypairs.concat([{ kid: event.kid, keypair: event.keypair }]),
				};
			}
			if (event.type === "delete_keypair") {
				return {
					...migrated,
					keypairs: migrated.keypairs.filter(existing => existing.kid !== event.kid),
				};
			}
			return {
				...migrated,
				credentials: SchemaV3.credentialReducer(migrated.credentials, event),
				presentations: SchemaV3.presentationReducer(migrated.presentations, event),
				settings: SchemaV3.settingsReducer(migrated.settings, event),
				credentialIssuanceSessions: event.type === "delete_credential_issuance_session"
					? migrated.credentialIssuanceSessions.filter(existing => existing.sessionId !== event.sessionId)
					: migrated.credentialIssuanceSessions,
			};
		}
		if (state.schemaVersion < schemaVersion && event.schemaVersion < schemaVersion) {
			return SchemaV3.WalletStateOperations.walletStateReducer(state, event);
		}
		throw new Error(`Cannot apply event with schemaVersion ${event.schemaVersion} to state with version ${state.schemaVersion}`);
	}

	return {
		...previousOperations,
		migrateState,
		walletStateReducer,
	};
}

export const WalletStateOperations = createOperations(SCHEMA_VERSION, SchemaV3.mergeStrategies);
