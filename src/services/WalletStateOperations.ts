import { FOLD_EVENT_HISTORY_AFTER_SECONDS } from "@/config";
import { CredentialKeyPair } from "./keystore";
import { WalletStateUtils } from "./WalletStateUtils";
import { JWK } from "jose";
import { SCHEMA_VERSION, WalletStateMigrations } from "./WalletStateMigrations";
import { compareBy } from "@/util";


export type WalletStateContainer = {
	events: WalletSessionEvent[];
	S: WalletState;
	lastEventHash: string;
};

export type WalletSessionEvent = {
	schemaVersion: number,
	parentHash: string,
	eventId: number,
	timestampSeconds: number,
} & WalletSessionEventTypeAttributes;

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
	settings: Record<string, unknown>,
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
	settings: Record<string, unknown>,
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
export type WalletStateSettings = WalletState['settings'];
export type WalletStateCredentialIssuanceSession = WalletState['credentialIssuanceSessions'][number];

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

function settingsReducer(state: WalletStateSettings = {}, newEvent: WalletSessionEvent) {
	switch (newEvent.type) {
		case "alter_settings":
			return { ...newEvent.settings };
		default:
			return state;
	}
}

async function getLastEventHashFromEventHistory(events: WalletSessionEvent[]): Promise<string> {
	return events.length > 0 ? WalletStateUtils.calculateEventHash(events[events.length - 1]) : "";
}



async function createWalletSessionEvent(container: WalletStateContainer): Promise<{ schemaVersion: number, eventId: number, parentHash: string, timestampSeconds: number }> {
	const baseEvent = {
		schemaVersion: SCHEMA_VERSION,
		eventId: WalletStateUtils.getRandomUint32(),
		parentHash: container.events.length === 0 ? container.lastEventHash : await getLastEventHashFromEventHistory(container.events),
		timestampSeconds: Math.floor(Date.now() / 1000),
	};
	return {
		...baseEvent,
	}
}

type MergeStrategy = (a: WalletSessionEvent[], b: WalletSessionEvent[]) => WalletSessionEvent[];

const mergeStrategies: Record<WalletSessionEvent["type"], MergeStrategy> = {
	new_credential: (a, b) => {
		const map = new Map<number, WalletSessionEvent>();
		// the following line removes the duplicate new_credential event that creates a credential with the same credentialId
		// assuming that credentialId is a safe randomly-generated number that was assigned during insertion
		[...a, ...b].forEach((event: WalletSessionEvent) => event.type === "new_credential" && map.set(event.credentialId, event));
		return [...map.values()];
	},
	delete_credential: (a, b) => {
		const map = new Map<number, WalletSessionEvent>();
		// the following line removes the duplicate delete_credential event that deletes the same credential
		[...a, ...b].forEach((event: WalletSessionEvent) => event.type === "delete_credential" && map.set(event.credentialId, event));
		return [...map.values()];
	},
	new_keypair: (a, b) => {
		const map = new Map<string, WalletSessionEvent>();
		[...a, ...b].forEach((event: WalletSessionEvent) => event.type === "new_keypair" && map.set(event.kid, event));
		return [...map.values()];
	},
	delete_keypair: (a, b) => {
		const map = new Map<string, WalletSessionEvent>();
		[...a, ...b].forEach((event: WalletSessionEvent) => event.type === "delete_keypair" && map.set(event.kid, event));
		return [...map.values()];
	},
	new_presentation: (a, b) => {
		const map = new Map<number, WalletSessionEvent>();
		// the following line accepts all presentations with unique eventId
		[...a, ...b].map((event: WalletSessionEvent) => event.type === "new_presentation" && map.set(event.eventId, event));
		return [...map.values()];
	},
	delete_presentation: (a, b) => {
		const map = new Map<number, WalletSessionEvent>();
		// similar to new_presentation
		[...a, ...b].forEach((event: WalletSessionEvent) => event.type === "delete_presentation" && map.set(event.eventId, event));
		return [...map.values()];
	},
	alter_settings: (a, b) => {
		const settingsEvents: WalletSessionEvent[] = [];
		// get only the latest applied setting during merge based on timestamp of event
		[...a, ...b].forEach((event: WalletSessionEvent) => event.type === "alter_settings" && settingsEvents.push(event));
		settingsEvents.sort(compareBy(e => e.timestampSeconds));
		return settingsEvents.length > 0 ? [settingsEvents[settingsEvents.length - 1]] : [];
	},
	save_credential_issuance_session: (a, b) => {
		const map = new Map<number, WalletSessionEvent>();
		[...a, ...b].map((event: WalletSessionEvent) => event.type === "save_credential_issuance_session" && map.set(event.eventId, event));
		return [...map.values()];
	},
};




async function mergeDivergentHistoriesWithStrategies(historyA: WalletSessionEvent[], historyB: WalletSessionEvent[], lastCommonAncestorHashFromEventHistory: string): Promise<WalletSessionEvent[]> {
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

/**
 * Divide `container1` and `container2` into shared and respective unique
 * events, and determine which base state a merged container should be based on.
 *
 * @returns Non-null if a common point of history is found between `container1`
 * and `container2`; null if no common point of history is found.
 */
export async function findMergeBase(
	container1: WalletStateContainer,
	container2: WalletStateContainer,
): Promise<{
	/** The `lastEventHash` of the container that is the ancestor of the other */
	lastEventHash: string,
	/** The `baseState` of the container that is the ancestor of the other */
	baseState: WalletState,
	/** All events present in both containers (either explicitly in both, or
	explicitly in one and already folded into base state in the other), in order
	*/
	commonEvents: WalletSessionEvent[],
	/** All events present only in `container1`, in order */
	uniqueEvents1: WalletSessionEvent[],
	/** All events present only in `container2`, in order */
	uniqueEvents2: WalletSessionEvent[],
} | null> {
	// Maps of event hashes to the index of the first diverged event in that
	// branch, if that hash is the last common parent hash.
	const history1: Map<string, number> = new Map();
	const history2: Map<string, number> = new Map();

	let i1 = container1.events.length - 1;
	let i2 = container2.events.length - 1;

	function decideCanonicalContainer(
		container1: WalletStateContainer,
		container2: WalletStateContainer,
		commonEventIndex1: number,
		commonEventIndex2: number,
	): [[WalletStateContainer, number], [WalletStateContainer, number]] {
		if (container1.lastEventHash === container2.lastEventHash) {
			// The containers start from the same event, so either is an equally valid choice.
			return [[container1, commonEventIndex1], [container2, commonEventIndex2]];
		} else {
			// Since the containers have a common event in their history, whichever
			// has more events before the common event must have a base state that is
			// an ancestor of the other's base state.
			if (commonEventIndex1 >= commonEventIndex2) {
				return [[container1, commonEventIndex1], [container2, commonEventIndex2]];
			} else {
				return [[container2, commonEventIndex2], [container1, commonEventIndex1]];
			}
		}
	}

	function finalizeFoundCommonEvent(commonEventIndex1: number, commonEventIndex2: number) {
		const [
			[ancestorContainer, ancestorUniqueIndex],
			[descendantContainer, descendantUniqueIndex]
		] = decideCanonicalContainer(container1, container2, commonEventIndex1, commonEventIndex2);
		return {
			lastEventHash: ancestorContainer.lastEventHash,
			baseState: ancestorContainer.S,
			commonEvents: ancestorContainer.events.slice(0, ancestorUniqueIndex),
			uniqueEvents1: ancestorContainer.events.slice(ancestorUniqueIndex),
			uniqueEvents2: descendantContainer.events.slice(descendantUniqueIndex),
		};
	}

	if (i1 >= 0) {
		history1.set(await WalletStateUtils.calculateEventHash(container1.events[i1]), i1 + 1);
	}
	if (i2 >= 0) {
		const hash = await WalletStateUtils.calculateEventHash(container2.events[i2]);
		history2.set(hash, i2 + 1);

		if (history1.has(hash) && history2.has(hash)) {
			// Both histories end with the same event hash, so they are semantically
			// equivalent.
			return finalizeFoundCommonEvent(history1.get(hash), history2.get(hash));
		}
	}

	while (i1 >= 0 || i2 >= 0) {
		if (i1 >= 0) {
			const hash = container1.events[i1].parentHash;
			history1.set(hash, i1);
			if (history1.has(hash) && history2.has(hash)) {
				return finalizeFoundCommonEvent(history1.get(hash), history2.get(hash));
			}
			i1 -= 1;
		} else if (i1 === -1) {
			const hash = container1.lastEventHash;
			history1.set(hash, 0);
			if (history1.has(hash) && history2.has(hash)) {
				return finalizeFoundCommonEvent(history1.get(hash), history2.get(hash));
			}
			i1 -= 1;
		}
		if (i2 >= 0) {
			const hash = container2.events[i2].parentHash;
			history2.set(hash, i2);
			if (history1.has(hash) && history2.has(hash)) {
				return finalizeFoundCommonEvent(history1.get(hash), history2.get(hash));
			}
			i2 -= 1;
		} else if (i2 === -1) {
			const hash = container2.lastEventHash;
			history2.set(hash, 0);
			if (history1.has(hash) && history2.has(hash)) {
				return finalizeFoundCommonEvent(history1.get(hash), history2.get(hash));
			}
			i2 -= 1;
		}
	}

	return null;
}

async function rebuildEventHistory(events: WalletSessionEvent[], lastEventHash: string): Promise<WalletSessionEvent[]> {
	const newEvents: WalletSessionEvent[] = [];
	for (let i = 0; i < events.length; i++) {
		if (i == 0) {
			newEvents.push({
				...events[0],
				parentHash: lastEventHash,
			});
			continue;
		}
		newEvents.push(await WalletStateUtils.reparent(events[i], newEvents[i - 1]));
	}
	return newEvents;
}

export namespace WalletStateOperations {
	export const walletStateReducerRegistry = {
		1: WalletStateOperations.walletStateReducer
	};

	export function initialWalletStateContainer(): WalletStateContainer {
		return {
			S: { schemaVersion: SCHEMA_VERSION, credentials: [], presentations: [], keypairs: [], credentialIssuanceSessions: [], settings: { openidRefreshTokenMaxAgeInSeconds: 0 } },
			events: [],
			lastEventHash: "",
		}
	}

	export async function eventHistoryIsConsistent(container: WalletStateContainer): Promise<boolean> {
		const events = container.events;
		if (events.length === 0) {
			return true;
		}

		const eventHashes = await Promise.all(events.map(async (e) => WalletStateUtils.calculateEventHash(e)));
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

	export async function validateEventHistoryContinuity(container: WalletStateContainer): Promise<void> {
		const result = await eventHistoryIsConsistent(container);
		if (!result) {
			throw new Error("Invalid event history chain");
		}
	}

	export async function addNewCredentialEvent(container: WalletStateContainer, data: string, format: string, kid: string, batchId: number = 0, credentialIssuerIdentifier: string = "", credentialConfigurationId = "", instanceId: number = 0, credentialId: number = WalletStateUtils.getRandomUint32()): Promise<WalletStateContainer> {
		await validateEventHistoryContinuity(container);
		const newContainer: WalletStateContainer = {
			lastEventHash: container.lastEventHash,
			events: [
				...container.events,
				{
					...await createWalletSessionEvent(container),
					type: "new_credential",
					credentialId: credentialId,
					data,
					format,
					kid,
					batchId,
					credentialIssuerIdentifier,
					credentialConfigurationId,
					instanceId,
				},
			],
			S: container.S,
		};
		await validateEventHistoryContinuity(newContainer);
		return newContainer;
	}


	export async function addDeleteCredentialEvent(container: WalletStateContainer, credentialId: number): Promise<WalletStateContainer> {
		await validateEventHistoryContinuity(container);
		const newContainer: WalletStateContainer = {
			lastEventHash: container.lastEventHash,
			events: [
				...container.events,
				{
					...await createWalletSessionEvent(container),
					type: "delete_credential",
					credentialId,
				},
			],
			S: container.S,
		};
		await validateEventHistoryContinuity(newContainer);
		return newContainer;
	}

	export async function addNewKeypairEvent(container: WalletStateContainer, kid: string, keypair: CredentialKeyPair): Promise<WalletStateContainer> {
		await validateEventHistoryContinuity(container);
		const newContainer: WalletStateContainer = {
			lastEventHash: container.lastEventHash,
			events: [
				...container.events,
				{
					...await createWalletSessionEvent(container),
					type: "new_keypair",
					kid,
					keypair,
				},
			],
			S: container.S,
		};
		await validateEventHistoryContinuity(newContainer);
		return newContainer;
	}


	export async function addDeleteKeypairEvent(container: WalletStateContainer, kid: string): Promise<WalletStateContainer> {
		await validateEventHistoryContinuity(container);
		const newContainer: WalletStateContainer = {
			lastEventHash: container.lastEventHash,
			events: [
				...container.events,
				{
					...await createWalletSessionEvent(container),
					type: "delete_keypair",
					kid,
				},
			],
			S: container.S,
		};
		await validateEventHistoryContinuity(newContainer);
		return newContainer;
	}


	export async function addNewPresentationEvent(container: WalletStateContainer, transactionId: number, data: string, usedCredentialIds: number[], presentationTimestampSeconds: number, audience: string): Promise<WalletStateContainer> {
		await validateEventHistoryContinuity(container);

		const newContainer: WalletStateContainer = {
			lastEventHash: container.lastEventHash,
			events: [
				...container.events,
				{
					...await createWalletSessionEvent(container),
					type: "new_presentation",
					presentationId: WalletStateUtils.getRandomUint32(),
					transactionId: transactionId,
					data,
					usedCredentialIds,
					presentationTimestampSeconds,
					audience,
				},
			],
			S: container.S,
		};
		await validateEventHistoryContinuity(newContainer);
		return newContainer;
	}


	export async function addDeletePresentationEvent(container: WalletStateContainer, presentationId: number): Promise<WalletStateContainer> {
		await validateEventHistoryContinuity(container);
		const newContainer: WalletStateContainer = {
			lastEventHash: container.lastEventHash,
			events: [
				...container.events,
				{
					...await createWalletSessionEvent(container),
					type: "delete_presentation",
					presentationId,
				},
			],
			S: container.S,
		};
		await validateEventHistoryContinuity(newContainer);
		return newContainer;
	}

	export async function addAlterSettingsEvent(container: WalletStateContainer, settings: Record<string, string>): Promise<WalletStateContainer> {
		await validateEventHistoryContinuity(container);
		const newContainer: WalletStateContainer = {
			lastEventHash: container.lastEventHash,
			events: [
				...container.events,
				{
					...await createWalletSessionEvent(container),
					type: "alter_settings",
					settings: settings,
				},
			],
			S: container.S,
		};
		await validateEventHistoryContinuity(newContainer);
		return newContainer;
	}


	export async function addSaveCredentialIssuanceSessionEvent(container: WalletStateContainer,
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
		created?: number
	): Promise<WalletStateContainer> {

		await validateEventHistoryContinuity(container);

		const newContainer: WalletStateContainer = {
			lastEventHash: container.lastEventHash,
			events: [
				...container.events,
				{
					...await createWalletSessionEvent(container),
					type: "save_credential_issuance_session",
					sessionId: sessionId,

					credentialIssuerIdentifier,
					state,
					code_verifier,
					credentialConfigurationId,
					tokenResponse,
					dpop,
					firstPartyAuthorization,
					created: created ?? Math.floor(Date.now() / 1000),
				},
			],
			S: container.S,
		};
		await validateEventHistoryContinuity(newContainer);
		return newContainer;
	}


	export function walletStateReducer(state: WalletState = { schemaVersion: SCHEMA_VERSION, credentials: [], keypairs: [], presentations: [], credentialIssuanceSessions: [], settings: {} }, newEvent: WalletSessionEvent): WalletState {
		if (newEvent.schemaVersion < state.schemaVersion) {
			if (!(newEvent.schemaVersion in walletStateReducerRegistry)) {
				throw new Error(`Cannot apply WalletStateEvent v${newEvent.schemaVersion} to WalletState v${state.schemaVersion}: no reducer found`);
			}
			const reduced = walletStateReducerRegistry[newEvent.schemaVersion](state, newEvent);
			return WalletStateMigrations.migrateWalletStateToCurrent(reduced);
		}

		if (newEvent.schemaVersion > state.schemaVersion) {
			state = WalletStateMigrations.migrateWalletStateTo(newEvent.schemaVersion, state);
		}

		return {
			schemaVersion: newEvent.schemaVersion,
			credentials: credentialReducer(state.credentials, newEvent),
			keypairs: keypairReducer(state.keypairs, newEvent),
			presentations: presentationReducer(state.presentations, newEvent),
			credentialIssuanceSessions: credentialIssuanceSessionReducer(state.credentialIssuanceSessions, newEvent),
			settings: settingsReducer(state.settings, newEvent)
		}
	}

	export async function mergeEventHistories(container1: WalletStateContainer, container2: WalletStateContainer): Promise<WalletStateContainer> {
		const mergeBase = await findMergeBase(container1, container2);
		if (mergeBase === null) {
			const events = [...container1.events, ...container2.events].sort(compareBy(e => e.timestampSeconds));
			const newContainer = {
				...container1,
				events: events,
			};
			await validateEventHistoryContinuity(newContainer);
			return newContainer;
		}

		const { lastEventHash, baseState, commonEvents, uniqueEvents1, uniqueEvents2 } = mergeBase;
		const lastCommonEvent = commonEvents[commonEvents.length - 1];
		const pointOfDivergenceHash = (
			lastCommonEvent
				? await WalletStateUtils.calculateEventHash(lastCommonEvent)
				: lastEventHash
		);

		const mergeDivergentPartsResult = await mergeDivergentHistoriesWithStrategies(
			uniqueEvents1,
			uniqueEvents2,
			pointOfDivergenceHash,
		);
		const newEventHistory = commonEvents.concat(mergeDivergentPartsResult);
		const newContainer = {
			lastEventHash,
			S: baseState,
			events: newEventHistory,
		};
		await validateEventHistoryContinuity(newContainer);
		return newContainer;
	}

	/**
	 * Returns the result of folding all event history into the base state.
	 */
	export function foldState(container: WalletStateContainer): WalletState {
		return container.events.reduce(walletStateReducer, container.S);
	}

	/**
	 * Returns the container with the first history event, if any, folded into the base state.
	 * If the container has no events, the same object is returned unchanged.
	 */
	export async function foldNextEventIntoBaseState(container: WalletStateContainer): Promise<WalletStateContainer> {
		const [event, ...events] = container.events;
		if (event) {
			return {
				S: walletStateReducer(container.S, event),
				events,
				lastEventHash: events[0]?.parentHash ?? await WalletStateUtils.calculateEventHash(event),
			};
		} else {
			return container;
		}
	}

	/**
	 * Returns container with folded history for events older than `now - foldEventHistoryAfter`
	 */
	export async function foldOldEventsIntoBaseState({ events, S, lastEventHash }: WalletStateContainer, foldEventHistoryAfter = FOLD_EVENT_HISTORY_AFTER_SECONDS): Promise<WalletStateContainer> {
		const now = Math.floor(Date.now() / 1000);
		const foldBefore = now - foldEventHistoryAfter;
		const firstYoungIndex = events.findIndex(event => event.timestampSeconds >= foldBefore);
		const splitIndex = (firstYoungIndex === -1 ? events.length : firstYoungIndex);
		if (splitIndex === 0) {
			return {
				events,
				S,
				lastEventHash,
			};
		}
		const newEvents = events.slice(splitIndex);
		const newLastEventHash = newEvents[0]?.parentHash ?? await WalletStateUtils.calculateEventHash(events[splitIndex - 1]);
		return {
			events: newEvents,
			S: events.slice(0, splitIndex).reduce(walletStateReducer, S),
			lastEventHash: newLastEventHash,
		};
	}
}
