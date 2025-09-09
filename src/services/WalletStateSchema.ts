import { FOLD_EVENT_HISTORY_AFTER_SECONDS } from "@/config";
import { compareBy, findIndexOrEnd, last } from "@/util";

import * as SchemaV1 from "./WalletStateSchemaVersion1";
import * as CurrentSchema from "./WalletStateSchemaVersion1";

export * as SchemaV1 from "./WalletStateSchemaVersion1";
export * as CurrentSchema from "./WalletStateSchemaVersion1";


export type WalletStateContainerGeneric = WalletStateContainer<WalletState, WalletSessionEvent>;
export interface WalletStateContainer<S extends WalletState, E extends WalletSessionEvent> {
	events: E[];
	S: S;
	lastEventHash: string;
}

export interface WalletState {
	schemaVersion: number,
}

export interface WalletSessionEvent {
	schemaVersion: number,
	parentHash: string,
	eventId: number,
	timestampSeconds: number,
	type: string,
}

interface WalletStateOperations<S extends WalletState, E extends WalletSessionEvent> {
	initialWalletStateContainer(): WalletStateContainer<S, E>;
	migrateState(state: WalletState): S;
	migrateContainer(container: WalletStateContainerGeneric): WalletStateContainer<WalletState, E>;
	walletStateReducer(state: S, newEvent: E): S;
	calculateEventHash(event: E): Promise<string>;
	mergeDivergentHistoriesWithStrategies(historyA: E[], historyB: E[], lastCommonAncestorHashFromEventHistory: string): Promise<E[]>;
}

function getSchema(schemaVersion: number): WalletStateOperations<WalletState, WalletSessionEvent> {
	switch (schemaVersion) {
		case 1:
			return SchemaV1.WalletStateOperations;

		default:
			throw new Error(`Unknown schema version: ${schemaVersion}`);
	}
}

export async function eventHistoryIsConsistent(
	container: WalletStateContainerGeneric,
): Promise<boolean> {
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

export async function validateEventHistoryContinuity(
	container: WalletStateContainerGeneric,
): Promise<void> {
	const result = await eventHistoryIsConsistent(container);
	if (!result) {
		throw new Error("Invalid event history chain");
	}
}

export async function calculateEventHash(event: WalletSessionEvent): Promise<string> {
	return getSchema(event.schemaVersion).calculateEventHash(event);
}

export async function reparent<E extends WalletSessionEvent>(
	childEvent: E,
	parentEvent: WalletSessionEvent,
): Promise<E> {
	return {
		...childEvent,
		parentHash: await calculateEventHash(parentEvent),
	};
}

export async function rebuildEventHistory<E extends WalletSessionEvent>(events: E[], lastEventHash: string): Promise<E[]> {
	const newEvents: E[] = [];
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

/**
 * Returns the container with the next event, if any, folded into the base
 * state. If the container has no events, it is returned unchanged.
 */
export async function foldNextEvent<S extends WalletState, E extends WalletSessionEvent>(
	container: WalletStateContainer<S, E>,
): Promise<WalletStateContainer<S, E>> {
	if (container.events.length > 0) {
		const { S, events: [nextEvent, ...restEvents] } = container;
		const schema = getSchema(nextEvent.schemaVersion);
		return {
			S: schema.walletStateReducer(schema.migrateState(S), nextEvent) as S,
			events: restEvents,
			lastEventHash: restEvents[0]?.parentHash ?? await calculateEventHash(nextEvent),
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
	container: WalletStateContainer<S, E>,
	foldEventHistoryAfter = FOLD_EVENT_HISTORY_AFTER_SECONDS,
): Promise<WalletStateContainer<S, E>> {
	const now = Math.floor(Date.now() / 1000);
	const foldBefore = now - foldEventHistoryAfter;
	while (container.events.length > 0 && container.events[0].timestampSeconds <= foldBefore) {
		container = await foldNextEvent(container);
	}
	return container;
}

async function mergeDivergentHistoriesWithStrategies(
	historyA: WalletSessionEvent[],
	historyB: WalletSessionEvent[],
	lastCommonAncestorHashFromEventHistory: string,
): Promise<WalletSessionEvent[]> {
	if (historyA.length === 0) {
		return rebuildEventHistory(historyB, lastCommonAncestorHashFromEventHistory);
	} else if (historyB.length === 0) {
		return rebuildEventHistory(historyA, lastCommonAncestorHashFromEventHistory);

	} else {
		const firstSchemaVersion = Math.min(historyA[0].schemaVersion, historyB[0].schemaVersion);
		const splitPointA = findIndexOrEnd(historyA, e => e.schemaVersion !== firstSchemaVersion);
		const splitPointB = findIndexOrEnd(historyB, e => e.schemaVersion !== firstSchemaVersion);

		const firstPart = await rebuildEventHistory(
			await getSchema(firstSchemaVersion).mergeDivergentHistoriesWithStrategies(
				historyA.slice(0, splitPointA),
				historyB.slice(0, splitPointB),
				lastCommonAncestorHashFromEventHistory,
			),
			lastCommonAncestorHashFromEventHistory,
		);
		const nextParentHash = await calculateEventHash(last(firstPart));

		return [...firstPart, ...await mergeDivergentHistoriesWithStrategies(
			historyA.slice(splitPointA),
			historyB.slice(splitPointB),
			nextParentHash,
		)];
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
		history1.set(await calculateEventHash(container1.events[i1]), i1 + 1);
	}
	if (i2 >= 0) {
		const hash = await calculateEventHash(container2.events[i2]);
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
		await validateEventHistoryContinuity(newContainer);
		return newContainer;
	}

	const { lastEventHash, baseState, commonEvents, uniqueEvents1, uniqueEvents2 } = mergeBase;
	const lastCommonEvent = last(commonEvents);
	const pointOfDivergenceHash = (
		lastCommonEvent
			? await calculateEventHash(lastCommonEvent)
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
