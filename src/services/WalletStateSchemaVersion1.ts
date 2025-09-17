import { CredentialKeyPair } from "./keystore";
import { JWK } from "jose";
import { sha256 } from "./WalletStateUtils";
import { compareBy, deduplicateFromRightBy, maxByKey } from "@/util";
import * as WalletSchemaCommon from "./WalletStateSchemaCommon";


export const SCHEMA_VERSION = 1;


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
	created: number,
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

function normalize(obj: any) {
	if (Array.isArray(obj)) {
		return obj.map(normalize);
	} else if (obj && typeof obj === 'object' && obj.constructor === Object) {
		return Object.keys(obj)
			.sort()
			.reduce((acc: any, key: any) => {
				acc[key] = normalize(obj[key]);
				return acc;
			}, {});
	}
	return obj;
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
				created: newEvent.created,
			}]);
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

export type MergeStrategy = (a: WalletSessionEvent[], b: WalletSessionEvent[]) => WalletSessionEvent[];

export const mergeStrategies: Record<WalletSessionEvent["type"], MergeStrategy> = {
	new_credential: (a, b) => {
		// Remove duplicate new_credential events that create a credential with the same credentialId
		// assuming that credentialId is a safe randomly-generated number that was assigned during insertion
		return deduplicateFromRightBy(a.concat(b).filter(e => e.type === "new_credential"), e => e.credentialId);
	},
	delete_credential: (a, b) => {
		// the following line removes the duplicate delete_credential event that deletes the same credential
		return deduplicateFromRightBy(a.concat(b).filter(e => e.type === "delete_credential"), e => e.credentialId);
	},
	new_keypair: (a, b) => {
		return deduplicateFromRightBy(a.concat(b).filter(e => e.type === "new_keypair"), e => e.kid);
	},
	delete_keypair: (a, b) => {
		return deduplicateFromRightBy(a.concat(b).filter(e => e.type === "delete_keypair"), e => e.kid);
	},
	new_presentation: (a, b) => {
		// Keep all presentations with unique eventId
		return deduplicateFromRightBy(a.concat(b).filter(e => e.type === "new_presentation"), e => e.eventId);
	},
	delete_presentation: (a, b) => {
		// similar to new_presentation
		return deduplicateFromRightBy(a.concat(b).filter(e => e.type === "delete_presentation"), e => e.eventId);
	},
	alter_settings: (a, b) => {
		// get only the latest applied setting during merge based on timestamp of event
		const settingsEvents: WalletSessionEvent[] = a.concat(b).filter(e => e.type === "alter_settings");
		const latest = maxByKey(settingsEvents, e => e.timestampSeconds);
		return latest ? [latest] : [];
	},
	save_credential_issuance_session: (a, b) => {
		return deduplicateFromRightBy(a.concat(b).filter(e => e.type === "save_credential_issuance_session"), e => e.eventId);
	},
};


export function createOperations(
	SCHEMA_VERSION: number,
	mergeStrategies: Record<WalletSessionEvent["type"], MergeStrategy>,
) {

	async function calculateEventHash(event: WalletSchemaCommon.WalletSessionEvent | undefined): Promise<string> {
		if (event === undefined) {
			return "";
		}
		if (event.schemaVersion > SCHEMA_VERSION) {
			throw new Error(`Cannot use schema v${SCHEMA_VERSION} to calculate hash of event with schema v${event.schemaVersion}`);
		}

		// if new new_keypair event, then don't include the wrappedPrivateKey because it changes after every change of the keystore
		if (event.type === 'new_keypair' && 'keypair' in event && typeof event.keypair === 'object') {
			return sha256(JSON.stringify(normalize({
				...event,
				keypair: {
					...event.keypair,
					wrappedPrivateKey: null,
				},
			} as unknown as WalletSessionEventNewKeypair)));
		}
		return sha256(JSON.stringify(normalize(event)));
	}

	async function reparent(
		childEvent: WalletSchemaCommon.WalletSessionEvent,
		parentEvent: WalletSchemaCommon.WalletSessionEvent,
	): Promise<WalletSchemaCommon.WalletSessionEvent> {
		return {
			...childEvent,
			parentHash: await calculateEventHash(parentEvent),
		};
	}

	async function rebuildEventHistory(
		events: WalletSchemaCommon.WalletSessionEvent[],
		lastEventHash: string,
	): Promise<WalletSchemaCommon.WalletSessionEvent[]> {
		const newEvents: WalletSchemaCommon.WalletSessionEvent[] = [];
		for (let i = 0; i < events.length; i++) {
			if (i == 0) {
				newEvents.push({
					...events[0],
					parentHash: lastEventHash,
				});
				continue;
			}
			newEvents.push(await reparent(events[i], newEvents[i - 1]));
		}
		return newEvents;
	}

	async function eventHistoryIsConsistent(container: WalletSchemaCommon.WalletStateContainerGeneric): Promise<boolean> {
		const events = container.events;
		if (events.length === 0) {
			return true;
		}

		const eventHashes = await Promise.all(events.map(async (e) => calculateEventHash(e)));
		if (container.lastEventHash !== "" && events[0].parentHash !== container.lastEventHash) {
			return false;
		}
		for (let i = 1; i < events.length; i++) {
			if (events[i].parentHash !== eventHashes[i - 1]) {
				return false;
			}
		}
		return true;
	}

	async function validateEventHistoryContinuity(container: WalletSchemaCommon.WalletStateContainerGeneric): Promise<void> {
		const result = await eventHistoryIsConsistent(container);
		if (!result) {
			throw new Error("Invalid event history chain");
		}
	}

	function initialWalletStateContainer(): WalletStateContainer {
		return {
			S: { schemaVersion: SCHEMA_VERSION, credentials: [], presentations: [], keypairs: [], credentialIssuanceSessions: [], settings: { openidRefreshTokenMaxAgeInSeconds: '0' } },
			events: [],
			lastEventHash: "",
		}
	}

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

	function walletStateReducer(state: WalletState, newEvent: WalletSessionEvent): WalletState {
		if (newEvent.schemaVersion === state.schemaVersion) {
			return {
				...state,
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

	async function mergeDivergentHistoriesWithStrategies(
		/** Will always be empty for schema version 1, can safely ignore */
		_mergedByEarlierSchemaVersions: WalletSchemaCommon.WalletSessionEvent[],
		historyA: WalletSessionEvent[],
		historyB: WalletSessionEvent[],
		lastCommonAncestorHashFromEventHistory: string,
	): Promise<WalletSchemaCommon.WalletSessionEvent[]> {
		const eventsByType: Record<WalletSessionEvent["type"], [WalletSessionEvent[], WalletSessionEvent[]]> = {
			new_credential: [[], []],
			delete_credential: [[], []],
			new_keypair: [[], []],
			delete_keypair: [[], []],
			new_presentation: [[], []],
			delete_presentation: [[], []],
			alter_settings: [[], []],
			save_credential_issuance_session: [[], []],
		};

		for (const event of historyA) {
			eventsByType[event.type][0].push(event);
		}

		for (const event of historyB) {
			eventsByType[event.type][1].push(event);
		}

		let mergedEvents: WalletSessionEvent[] = [];
		for (const type in mergeStrategies) {
			const [a, b] = eventsByType[type as WalletSessionEvent["type"]];
			const merged = mergeStrategies[type as WalletSessionEvent["type"]](a, b);
			mergedEvents = mergedEvents.concat(merged);
		}

		mergedEvents.sort(compareBy(e => e.timestampSeconds));
		return rebuildEventHistory(mergedEvents, lastCommonAncestorHashFromEventHistory);
	}

	return {
		initialWalletStateContainer,
		migrateState,
		calculateEventHash,
		reparent,
		rebuildEventHistory,
		eventHistoryIsConsistent,
		validateEventHistoryContinuity,
		walletStateReducer,
		mergeDivergentHistoriesWithStrategies,
	};
}

export const WalletStateOperations = createOperations(SCHEMA_VERSION, mergeStrategies);
