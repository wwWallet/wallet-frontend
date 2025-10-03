import { FOLD_EVENT_HISTORY_AFTER_SECONDS } from "@/config";
import { compareBy, last, splitWhen } from "@/util";

import * as SchemaV1 from "./WalletStateSchemaVersion1";
import * as SchemaV2 from "./WalletStateSchemaVersion2";
import * as CurrentSchema from "./WalletStateSchemaVersion2";
import { WalletSessionEvent, WalletState, WalletStateContainerGeneric, WalletStateOperations } from "./WalletStateSchemaCommon";
import * as WalletSchemaCommon from "./WalletStateSchemaCommon";
import { WalletStateUtils } from "./WalletStateUtils";
import { CredentialKeyPair } from "./keystore";
import { JWK } from "jose";

export * as SchemaV1 from "./WalletStateSchemaVersion1";
export * as SchemaV2 from "./WalletStateSchemaVersion2";
export * as CurrentSchema from "./WalletStateSchemaVersion2";


const {
	SCHEMA_VERSION,
	WalletStateOperations: {
		calculateEventHash,
		validateEventHistoryContinuity,
	},
} = CurrentSchema;

type WalletStateContainer = CurrentSchema.WalletStateContainer;
type WalletStateSettings = CurrentSchema.WalletStateSettings;


function getSchema(schemaVersion: number): WalletStateOperations<WalletState, WalletSessionEvent> {
	switch (schemaVersion) {
		case 1:
			return SchemaV1.WalletStateOperations;
		case 2:
			return SchemaV2.WalletStateOperations;

		default:
			throw new Error(`Unknown schema version: ${schemaVersion}`);
	}
}


export async function createWalletSessionEvent(container: WalletStateContainer): Promise<{ schemaVersion: number, eventId: number, parentHash: string, timestampSeconds: number }> {
	const baseEvent = {
		schemaVersion: SCHEMA_VERSION,
		eventId: WalletStateUtils.getRandomUint32(),
		parentHash: container.events.length === 0
			? container.lastEventHash
			: await calculateEventHash(last(container.events)),
		timestampSeconds: Math.floor(Date.now() / 1000),
	};
	return {
		...baseEvent,
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

export async function addAlterSettingsEvent(container: WalletStateContainer, settings: WalletStateSettings): Promise<WalletStateContainer> {
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
	credentialEndpoint?: {
		transactionId?: string,
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
				credentialEndpoint,
				created: created ?? Math.floor(Date.now() / 1000),
			},
		],
		S: container.S,
	};
	await validateEventHistoryContinuity(newContainer);
	return newContainer;
}

export async function addDeleteCredentialIssuanceSessionEvent(container: WalletStateContainer,
	sessionId: number,
): Promise<WalletStateContainer> {

	await validateEventHistoryContinuity(container);

	const newContainer: WalletStateContainer = {
		lastEventHash: container.lastEventHash,
		events: [
			...container.events,
			{
				...await createWalletSessionEvent(container),
				type: "delete_credential_issuance_session",
				sessionId: sessionId,
			},
		],
		S: container.S,
	};
	await validateEventHistoryContinuity(newContainer);
	return newContainer;
}

/**
 * Returns the container with the next event, if any, folded into the base
 * state. If the container has no events, it is returned unchanged.
 */
export async function foldNextEvent<S extends WalletState, E extends WalletSessionEvent>(
	container: WalletSchemaCommon.WalletStateContainer<S, E>,
): Promise<WalletSchemaCommon.WalletStateContainer<S, E>> {
	if (container.events.length > 0) {
		const { S, events: [nextEvent, ...restEvents] } = container;
		const schema = getSchema(nextEvent.schemaVersion);
		return {
			S: schema.walletStateReducer(S, nextEvent) as S,
			events: restEvents,
			lastEventHash: restEvents[0]?.parentHash ?? await schema.calculateEventHash(nextEvent),
		};
	} else {
		return container;
	}
}

/**
 * Returns the result of folding all event history into the base state.
 */
export function foldState(container: WalletStateContainerGeneric): CurrentSchema.WalletState {
	return CurrentSchema.WalletStateOperations.migrateState(
		container.events.reduce(
			(s, e) => getSchema(e.schemaVersion).walletStateReducer(s, e),
			container.S,
		));
}

/**
 * Returns container with folded history for events older than `now - foldEventHistoryAfter`
 */
export async function foldOldEventsIntoBaseState<S extends WalletState, E extends WalletSessionEvent>(
	container: WalletSchemaCommon.WalletStateContainer<S, E>,
	foldEventHistoryAfter = FOLD_EVENT_HISTORY_AFTER_SECONDS,
): Promise<WalletSchemaCommon.WalletStateContainer<S, E>> {
	const now = Math.floor(Date.now() / 1000);
	const foldBefore = now - foldEventHistoryAfter;
	while (container.events.length > 0 && container.events[0].timestampSeconds <= foldBefore) {
		container = await foldNextEvent(container);
	}
	return container;
}

async function mergeDivergentHistoriesWithStrategies(
	mergedByEarlierSchemaVersions: WalletSessionEvent[],
	historyA: WalletSessionEvent[],
	historyB: WalletSessionEvent[],
	lastCommonAncestorHashFromEventHistory: string,
): Promise<WalletSessionEvent[]> {
	if (historyA.length === 0 && historyB.length === 0) {
		return [];

	} else {
		// Merge events one schema version at a time. Each schema version may define
		// its own merge strategies for the event types defined in that version, so
		// we cannot in general merge version 1 events with the version 3 merge
		// strategy, for example.
		//
		// For each schema version traversed, the events merged so far are
		// accumulated into the `mergedByEarlierSchemaVersions` argument to
		// subsequent schema versions. This way, later schema versions can still
		// de-duplicate against events of earlier versions: for instance, a v2
		// "delete_credential" event can be de-duplicated against a v1
		// "delete_credential" event with the same `credentialId`.

		const firstSchemaVersion = Math.min(...[
			historyA[0]?.schemaVersion,
			historyB[0]?.schemaVersion,
		].filter(v => v !== undefined));
		const [startA, tailA] = splitWhen(historyA, e => e.schemaVersion !== firstSchemaVersion);
		const [startB, tailB] = splitWhen(historyB, e => e.schemaVersion !== firstSchemaVersion);

		const firstPart = await CurrentSchema.WalletStateOperations.rebuildEventHistory(
			await getSchema(firstSchemaVersion).mergeDivergentHistoriesWithStrategies(
				mergedByEarlierSchemaVersions,
				startA,
				startB,
				lastCommonAncestorHashFromEventHistory,
			),
			lastCommonAncestorHashFromEventHistory,
		);
		const nextParentHash = await CurrentSchema.WalletStateOperations.calculateEventHash(last(firstPart));

		return [...firstPart, ...await mergeDivergentHistoriesWithStrategies(firstPart, tailA, tailB, nextParentHash)];
	}
}

/**
 * Divide `container1` and `container2` into shared and respective unique
 * events, and determine which base state a merged container should be based on.
 *
 * @returns Non-null if a common point of history is found between `container1`
 * and `container2`; null if no common point of history is found.
 */
export async function findMergeBase(
	container1: WalletStateContainerGeneric,
	container2: WalletStateContainerGeneric,
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
		container1: WalletStateContainerGeneric,
		container2: WalletStateContainerGeneric,
		commonEventIndex1: number,
		commonEventIndex2: number,
	): [[WalletStateContainerGeneric, number], [WalletStateContainerGeneric, number]] {
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
		history1.set(await getSchema(container1.events[i1].schemaVersion).calculateEventHash(container1.events[i1]), i1 + 1);
	}
	if (i2 >= 0) {
		const hash = await getSchema(container2.events[i2].schemaVersion).calculateEventHash(container2.events[i2]);
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

export async function mergeEventHistories(container1: WalletStateContainerGeneric, container2: WalletStateContainerGeneric): Promise<WalletStateContainerGeneric> {
	const mergeBase = await findMergeBase(container1, container2);
	if (mergeBase === null) {
		const events = [...container1.events, ...container2.events].sort(compareBy(e => e.timestampSeconds));
		const newContainer = {
			...container1,
			events: events,
		};
		await CurrentSchema.WalletStateOperations.validateEventHistoryContinuity(newContainer);
		return newContainer;
	}

	const { lastEventHash, baseState, commonEvents, uniqueEvents1, uniqueEvents2 } = mergeBase;
	const lastCommonEvent = last(commonEvents);
	const pointOfDivergenceHash = (
		lastCommonEvent
			? await getSchema(lastCommonEvent.schemaVersion).calculateEventHash(lastCommonEvent)
			: lastEventHash
	);

	const mergeDivergentPartsResult = await mergeDivergentHistoriesWithStrategies(
		[],
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
	await CurrentSchema.WalletStateOperations.validateEventHistoryContinuity(newContainer);
	return newContainer;
}
