import { byteArrayEquals, compareBy, deduplicateBy, toBase64Url } from '@/util';
import * as SchemaV2 from './WalletStateSchemaVersion2';
import * as WalletSchemaCommon from './WalletStateSchemaCommon';
import { WebauthnSignArkgPublicSeed, WebauthnSignSplitBbsKeypair } from './keystore';

export * from './WalletStateSchemaVersion2';


export const SCHEMA_VERSION = 3;

export type WalletStateContainer = {
	events: WalletSessionEvent[];
	S: WalletState;
	lastEventHash: string;
};
export type WalletSessionEvent = WalletSchemaCommon.WalletSessionEvent & WalletSessionEventTypeAttributes;
export type WalletSessionEventV3 = WalletSessionEvent & WalletSessionEventTypeAttributesV3;

export type WalletSessionEventTypeAttributes = (
	SchemaV2.WalletSessionEventTypeAttributes
	| WalletSessionEventTypeAttributesV3
);

export type WalletSessionEventTypeAttributesV3 = (
	WalletSessionEventNewArkgSeed
	| WalletSessionEventDeleteArkgSeed
	| WalletSessionEventNewSplitBbsKeypair
	| WalletSessionEventDeleteSplitBbsKeypair
)

export type WalletSessionEventNewArkgSeed = {
	type: "new_arkg_seed",
	arkgSeed: WebauthnSignArkgPublicSeed,
}

export type WalletSessionEventDeleteArkgSeed = {
	type: "delete_arkg_seed",
	credentialId: Uint8Array,
}

export type WalletSessionEventNewSplitBbsKeypair = {
	type: "new_split_bbs_keypair",
	splitBbsKeypair: WebauthnSignSplitBbsKeypair,
}

export type WalletSessionEventDeleteSplitBbsKeypair = {
	type: "delete_split_bbs_keypair",
	credentialId: Uint8Array,
}

export type WalletState = SchemaV2.WalletState & {
	arkgSeeds: WebauthnSignArkgPublicSeed[],
	splitBbsKeypairs: WebauthnSignSplitBbsKeypair[],
}

function isV3Event(event: WalletSessionEvent): event is WalletSessionEventV3 {
	return [
		"new_arkg_seed",
		"delete_arkg_seed",
		"new_split_bbs_keypair",
		"delete_split_bbs_keypair",
	].includes(event.type);
}

export type MergeStrategy = SchemaV2.MergeStrategy<WalletSessionEvent>;
export const mergeStrategies: Record<WalletSessionEvent["type"], MergeStrategy> = {
	...SchemaV2.mergeStrategies,
	new_arkg_seed: (_mbesv, a, b) => {
		// This event doesn't exist in v2, can safely ignore `mergedByEarlierSchemaVersions` argument
		return deduplicateBy(
			a.concat(b)
				.filter(e => e.type === 'new_arkg_seed')
				.sort(compareBy(e => e.timestampSeconds)),
			e => toBase64Url(e.arkgSeed.credentialId),
		);
	},
	new_split_bbs_keypair: (_mbesv, a, b) => {
		// This event doesn't exist in v2, can safely ignore `mergedByEarlierSchemaVersions` argument
		return deduplicateBy(
			a.concat(b)
				.filter(e => e.type === "new_split_bbs_keypair")
				.sort(compareBy(e => e.timestampSeconds)),
			e => toBase64Url(e.splitBbsKeypair.credentialId),
		);
	},
};

export function createOperations<Event extends WalletSchemaCommon.WalletSessionEvent>(
	SCHEMA_VERSION: number,
	mergeStrategies: Record<Event["type"], SchemaV2.MergeStrategy<Event>>,
) {
	const v2ops = SchemaV2.createOperations(SCHEMA_VERSION, mergeStrategies);

	function migrateState(state: WalletSchemaCommon.WalletState): WalletState {
		const ver = state?.schemaVersion ?? 1;
		if (ver === SCHEMA_VERSION) {
			return state as WalletState;
		} else if (ver < SCHEMA_VERSION){
			return {
				...state,
				schemaVersion: SCHEMA_VERSION,
				arkgSeeds: [],
				splitBbsKeypairs: [],
			} as WalletState;
		} else {
			throw new Error(`Cannot migrate state with schemaVersion ${state?.schemaVersion} to version ${SCHEMA_VERSION}`);
		}
	}

	function arkgSeedsReducer(state: WebauthnSignArkgPublicSeed[] = [], newEvent: WalletSessionEvent) {
		switch (newEvent.type) {
			case "new_arkg_seed":
				return state.concat([newEvent.arkgSeed]);
			case "delete_arkg_seed":
				return state.filter((s) => !byteArrayEquals(s.credentialId, newEvent.credentialId));
			default:
				return state;
		}
	}

	function splitBbsKeypairsReducer(state: WebauthnSignSplitBbsKeypair[] = [], newEvent: WalletSessionEvent) {
		switch (newEvent.type) {
			case "new_split_bbs_keypair":
				return state.concat([newEvent.splitBbsKeypair]);
			case "delete_split_bbs_keypair":
				return state.filter((s) => !byteArrayEquals(s.credentialId, newEvent.credentialId));
			default:
				return state;
		}
	}

	function walletStateReducer(
		state: WalletState,
		newEvent: WalletSessionEvent,
	): WalletState {
		if (newEvent.schemaVersion === state.schemaVersion) {
			if (isV3Event(newEvent)) {
				return {
					...state,
					arkgSeeds: arkgSeedsReducer(state.arkgSeeds, newEvent),
					splitBbsKeypairs: splitBbsKeypairsReducer(state.splitBbsKeypairs, newEvent),
				};
			} else {
				return migrateState(SchemaV2.WalletStateOperations.walletStateReducer(state, newEvent));
			}
		} else {
			return walletStateReducer(migrateState(state), newEvent);
		}
	}

	return {
		...v2ops,
		walletStateReducer,
		migrateState,

		initialWalletStateContainer(): WalletStateContainer {
			const containerV2 = SchemaV2.WalletStateOperations.initialWalletStateContainer();
			return {
				...containerV2,
				S: {
					...containerV2.S,
					schemaVersion: SCHEMA_VERSION,
					arkgSeeds: [],
					splitBbsKeypairs: [],
				},
			};
		},
	};
}

export const WalletStateOperations = createOperations(SCHEMA_VERSION, mergeStrategies);
