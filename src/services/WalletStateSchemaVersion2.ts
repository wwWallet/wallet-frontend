import { compareBy, deduplicateBy } from '@/util';
import * as WalletSchemaCommon from './WalletStateSchemaCommon';
import * as SchemaV1 from './WalletStateSchemaVersion1';
import { WalletSessionEvent } from './WalletStateSchemaVersion1';

export * from './WalletStateSchemaVersion1';


/**
	Schema version 2 deduplicates "new_presentation" and "delete_presentation"
	events by `presentationId` instead of by `eventId`. The state data structure is
	otherwise unchanged.
*/
export const SCHEMA_VERSION = 2;

export type MergeStrategy = (
	mergedByEarlierSchemaVersions: WalletSessionEvent[],
	a: WalletSessionEvent[],
	b: WalletSessionEvent[],
) => WalletSessionEvent[];


function deduplicateFromEarlierSchemaVersions<T>(
	mapToKey: (e: T) => (string | number | boolean),
	earlier: T[],
	a: T[],
	b: T[],
): [T[], T[]] {
	const existingKeys = new Set(earlier.map(mapToKey));
	const filterFunc = (e: T) => !existingKeys.has(mapToKey(e));
	return [a.filter(filterFunc), b.filter(filterFunc)];
}

function filterAll<T, U extends T>(
	predicate: (e: T) => e is U,
	a: T[],
	b: T[],
	c: T[],
): [U[], U[], U[]] {
	return [a.filter(predicate), b.filter(predicate), c.filter(predicate)];
}

function adaptStrategy<T, U extends T>(
	v1Strategy: (a: T[], b: T[]) => T[],
	typeFilter: (e: T) => e is U,
	mapToKey: (e: U) => (string | number | boolean),
): (earlier: T[], a: T[], b: T[]) => T[] {
	return (earlier: T[], a: T[], b: T[]) => v1Strategy(
		...deduplicateFromEarlierSchemaVersions(mapToKey, ...filterAll(typeFilter, earlier, a, b)),
	);
}

const v1strats = SchemaV1.mergeStrategies;

// V2 is mostly backwards compatible with deduplicating against V1 events.
// If a V2 event duplicates a V1 event (as determined by V2 comparison logic) involved in the merge,
// the V1 event is kept and the V2 event is discarded.
//
// In V2, new_presentation and delete_presentation events are deduplicated by presentationId instead of eventId.
export const mergeStrategies: Record<SchemaV1.WalletSessionEvent["type"], MergeStrategy> = {
	new_credential: adaptStrategy(v1strats.new_credential, e => e.type === "new_credential", e => e.credentialId),
	delete_credential: adaptStrategy(v1strats.delete_credential, e => e.type === "delete_credential", e => e.credentialId),
	new_keypair: adaptStrategy(v1strats.new_keypair, e => e.type === "new_keypair", e => e.kid),
	delete_keypair: adaptStrategy(v1strats.delete_keypair, e => e.type === "delete_keypair", e => e.kid),
	new_presentation: (mbesv, a, b) => {
		const [dedupA, dedupB] = deduplicateFromEarlierSchemaVersions(
			e => e.presentationId,
			...filterAll(e => e.type === "new_presentation", mbesv, a, b)
		);
		return deduplicateBy(dedupA.concat(dedupB).sort(compareBy(e => e.timestampSeconds)), e => e.presentationId);
	},
	delete_presentation: (mbesv, a, b) => {
		const [dedupA, dedupB] = deduplicateFromEarlierSchemaVersions(
			e => e.presentationId,
			...filterAll(e => e.type === "delete_presentation", mbesv, a, b)
		);
		return deduplicateBy(dedupA.concat(dedupB).sort(compareBy(e => e.timestampSeconds)), e => e.presentationId);
	},
	alter_settings: (mbesv, a, b) => {
		// Take the latest applied setting regardless of schema version
		const [merged] = v1strats.alter_settings(a, b);
		if (merged && mbesv.filter(e => e.type === "alter_settings").every(e => e.timestampSeconds < merged.timestampSeconds)) {
			return [merged];
		} else {
			return [];
		}
	},
	save_credential_issuance_session: adaptStrategy(
		v1strats.save_credential_issuance_session,
		e => e.type === "save_credential_issuance_session",
		e => e.eventId,
	),
	delete_credential_issuance_session: adaptStrategy(
		v1strats.delete_credential_issuance_session,
		e => e.type === "delete_credential_issuance_session",
		e => e.eventId,
	),
};

export function createOperations(
	SCHEMA_VERSION: number,
	mergeStrategies: Record<WalletSessionEvent["type"], MergeStrategy>,
) {
	const v1ops = SchemaV1.createOperations(SCHEMA_VERSION, null as Record<WalletSessionEvent["type"], SchemaV1.MergeStrategy>);
	return {
		...v1ops,

		async mergeDivergentHistoriesWithStrategies(
			mergedByEarlierSchemaVersions: WalletSchemaCommon.WalletSessionEvent[],
			historyA: WalletSessionEvent[],
			historyB: WalletSessionEvent[],
			parentHash: string,
		): Promise<WalletSchemaCommon.WalletSessionEvent[]> {
			const eventsByType: Record<WalletSessionEvent["type"], [WalletSessionEvent[], WalletSessionEvent[], WalletSessionEvent[]]> = {
				new_credential: [[], [], []],
				delete_credential: [[], [], []],
				new_keypair: [[], [], []],
				delete_keypair: [[], [], []],
				new_presentation: [[], [], []],
				delete_presentation: [[], [], []],
				alter_settings: [[], [], []],
				save_credential_issuance_session: [[], [], []],
				delete_credential_issuance_session: [[], [], []],
			};

			for (const event of mergedByEarlierSchemaVersions) {
				eventsByType[event.type][0].push(event);
			}

			for (const event of historyA) {
				eventsByType[event.type][1].push(event);
			}

			for (const event of historyB) {
				eventsByType[event.type][2].push(event);
			}

			let mergedEvents: WalletSessionEvent[] = [];
			for (const type in mergeStrategies) {
				const [mergedByEarlierSchemaVersions, a, b] = eventsByType[type as WalletSessionEvent["type"]];
				const merged = mergeStrategies[type as WalletSessionEvent["type"]](mergedByEarlierSchemaVersions, a, b);
				mergedEvents = mergedEvents.concat(merged);
			}

			mergedEvents.sort(compareBy(e => e.timestampSeconds));
			return v1ops.rebuildEventHistory(mergedEvents, parentHash);
		},

	};
}

export const WalletStateOperations = createOperations(SCHEMA_VERSION, mergeStrategies);
