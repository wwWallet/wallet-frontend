import { FOLD_EVENT_HISTORY_AFTER_SECONDS } from "@/config";
import { compareBy, findIndexOrEnd } from "@/util";

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

export async function getLastEventHashFromEventHistory(events: WalletSessionEvent[]): Promise<string> {
	return events.length > 0 ? calculateEventHash(events[events.length - 1]) : "";
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
		const nextParentHash = await getLastEventHashFromEventHistory(firstPart);

		return [...firstPart, ...await mergeDivergentHistoriesWithStrategies(
			historyA.slice(splitPointA),
			historyB.slice(splitPointB),
			nextParentHash,
		)];
	}
}

export function findDivergencePoint(events1: WalletSessionEvent[], events2: WalletSessionEvent[]): WalletSessionEvent | null {
	const parents1 = new Set();
	const parents2 = new Set();

	let i1 = events1.length - 1;
	let i2 = events2.length - 1;

	while (i1 >= 0 || i2 >= 0) {
		if (i1 >= 0) {
			if (parents2.has(events1[i1].parentHash)) {
				return events1[i1 - 1];
			}
			parents1.add(events1[i1].parentHash);
			i1 -= 1;
		}
		if (i2 >= 0) {
			if (parents1.has(events2[i2].parentHash)) {
				return events2[i2 - 1];
			}
			parents2.add(events2[i2].parentHash);
			i2 -= 1;
		}
	}
	return null;
}

export async function mergeEventHistories(container1: WalletStateContainerGeneric, container2: WalletStateContainerGeneric): Promise<WalletStateContainerGeneric> {
	const pointOfDivergence = findDivergencePoint(container1.events, container2.events);
	if (pointOfDivergence === null) {
		const events = [...container1.events, ...container2.events].sort(compareBy(e => e.schemaVersion, e => e.timestampSeconds));
		const newContainer = {
			...container1,
			events: events,
		};
		await validateEventHistoryContinuity(newContainer);
		return newContainer;
	}

	let pointOfDivergenceIndex = container1.events.findIndex(event => event.eventId === pointOfDivergence.eventId);
	const commonHistory = container1.events.slice(0, pointOfDivergenceIndex + 1);
	const history1DivergentPart = container1.events.slice(pointOfDivergenceIndex + 1);
	const history2DivergentPart = container2.events.slice(pointOfDivergenceIndex + 1);

	const mergeDivergentPartsResult = await mergeDivergentHistoriesWithStrategies(history1DivergentPart, history2DivergentPart, await calculateEventHash(pointOfDivergence));
	const newEventHistory = commonHistory.concat(mergeDivergentPartsResult);
	const newContainer = {
		...container1,
		events: newEventHistory,
	};
	await validateEventHistoryContinuity(newContainer);
	return newContainer;
}
