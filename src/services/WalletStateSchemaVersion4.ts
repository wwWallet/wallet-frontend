import { byteArrayEquals, compareBy, deduplicateBy, toBase64Url } from '@/util';
import * as SchemaV3 from './WalletStateSchemaVersion3';
import * as WalletSchemaCommon from './WalletStateSchemaCommon';
import { ParsedCOSEKeyArkgPubSeed } from 'wallet-common/dist/cose';

export * from './WalletStateSchemaVersion3';


export const SCHEMA_VERSION = 4;

type CredentialKeyPairCommon = Omit<SchemaV3.CredentialKeyPair, "privateKey">;
export type CredentialKeyPairWithCleartextPrivateKey = SchemaV3.CredentialKeyPair;
export type CredentialKeyPairWithExternalPrivateKey = CredentialKeyPairCommon & {
	externalPrivateKey: WebauthnSignKeyRef,
}
export type CredentialKeyPair = CredentialKeyPairWithCleartextPrivateKey | CredentialKeyPairWithExternalPrivateKey;

export type NewWebauthnSignKeypair = { arkg: WebauthnSignArkgPublicSeed };
export type WebauthnSignArkgPublicSeed = {
	credentialId: Uint8Array,
	publicSeed: ParsedCOSEKeyArkgPubSeed,
}

export type WebauthnSignKeyRef = {
	credentialId: Uint8Array,
	keyRef: Uint8Array,
}

export type WalletStateContainer = {
	events: WalletSessionEvent[];
	S: WalletStateV4OrEarlier;
	lastEventHash: string;
};
export type WalletSessionEventV4 = WalletSchemaCommon.WalletSessionEvent & WalletSessionEventTypeAttributesV4;
export type WalletSessionEventV4OrEarlier = SchemaV3.WalletSessionEvent | WalletSessionEventV4;
export type WalletSessionEvent = WalletSessionEventV4OrEarlier;

export type WalletSessionEventTypeAttributes = (
	SchemaV3.WalletSessionEventTypeAttributes
	| WalletSessionEventTypeAttributesV4
);

export type WalletSessionEventTypeAttributesV4 = (
	WalletSessionEventNewKeypair
	| WalletSessionEventNewArkgSeed
	| WalletSessionEventDeleteArkgSeed
)

export type WalletSessionEventNewKeypair = Omit<SchemaV3.WalletSessionEventNewKeypair, "keypair"> & {
	keypair: CredentialKeyPair,
}

export type WalletSessionEventNewArkgSeed = {
	type: "new_arkg_seed",
	arkgSeed: WebauthnSignArkgPublicSeed,
	name?: string,
}

export type WalletSessionEventDeleteArkgSeed = {
	type: "delete_arkg_seed",
	credentialId: Uint8Array,
}

export type MaybeNamed<T> = T & { name?: string };
export type WalletStateV4 = Omit<SchemaV3.WalletState, "keypairs"> & {
	keypairs: {
		kid: string,
		keypair: CredentialKeyPair,
	}[],
	arkgSeeds: MaybeNamed<WebauthnSignArkgPublicSeed>[],
}
export type WalletStateV4OrEarlier = SchemaV3.WalletStateV3OrEarlier | WalletStateV4;
export type WalletState = WalletStateV4;

function isLegacyState(state: WalletStateV4OrEarlier): state is SchemaV3.WalletStateV3OrEarlier {
	return state.schemaVersion < SCHEMA_VERSION;
}

function isLegacyEvent(event: WalletSessionEventV4OrEarlier): event is SchemaV3.WalletSessionEvent {
	return event.schemaVersion < SCHEMA_VERSION;
}

export type MergeStrategy = (
	mergedByEarlierSchemaVersions: WalletSessionEvent[],
	a: WalletSessionEvent[],
	b: WalletSessionEvent[],
) => WalletSessionEvent[];
export const mergeStrategies: Record<WalletSessionEvent["type"], MergeStrategy> = {
	...SchemaV3.mergeStrategies,
	new_arkg_seed: (_mbesv, a, b) => {
		// This event doesn't exist in v3, can safely ignore `mergedByEarlierSchemaVersions` argument
		return deduplicateBy(
			a.concat(b)
				.filter((e): e is (WalletSessionEvent & WalletSessionEventNewArkgSeed) => e.type === 'new_arkg_seed')
				.sort(compareBy(e => e.timestampSeconds)),
			e => toBase64Url(e.arkgSeed.credentialId),
		);
	},
	delete_arkg_seed: (_mbesv, a, b) => {
		// This event doesn't exist in v3, can safely ignore `mergedByEarlierSchemaVersions` argument
		return deduplicateBy(
			a.concat(b)
				.filter((e): e is (WalletSessionEvent & WalletSessionEventDeleteArkgSeed) => e.type === 'delete_arkg_seed')
				.sort(compareBy(e => e.timestampSeconds)),
			e => toBase64Url(e.credentialId),
		);
	},
};

export function createOperations<Event extends WalletSchemaCommon.WalletSessionEvent>(
	SCHEMA_VERSION: number,
	mergeStrategies: Record<Event["type"], MergeStrategy>,
) {
	const v3ops = SchemaV3.createOperations(SCHEMA_VERSION, mergeStrategies as typeof SchemaV3.mergeStrategies);

	function migrateState(state: WalletStateV4OrEarlier): WalletState {
		if (isLegacyState(state)) {
			const v3state = SchemaV3.WalletStateOperations.migrateState(state);
			return {
				...v3state,
				schemaVersion: SCHEMA_VERSION,
				arkgSeeds: [],
			};
		} else {
			return state;
		}
	}

	function arkgSeedsReducer(state: MaybeNamed<WebauthnSignArkgPublicSeed>[] = [], newEvent: WalletSessionEvent) {
		switch (newEvent.type) {
			case "new_arkg_seed":
				return state.concat([{ ...newEvent.arkgSeed, name: newEvent.name}]);
			case "delete_arkg_seed":
				return state.filter((s) => !byteArrayEquals(s.credentialId, newEvent.credentialId));
			default:
				return state;
		}
	}

	function walletStateReducer(
		state: WalletStateV4OrEarlier,
		newEvent: WalletSessionEvent,
	): WalletStateV4OrEarlier {
		if (isLegacyEvent(newEvent)) {
			return SchemaV3.WalletStateOperations.walletStateReducer(state as SchemaV3.WalletState, newEvent);
		} else {
			const stateV4 = migrateState(SchemaV3.WalletStateOperations.walletStateReducer(
				{ ...state, schemaVersion: 3 } as SchemaV3.WalletState,
				newEvent as unknown as SchemaV3.WalletSessionEvent,
			));
			return {
				...stateV4,
				arkgSeeds: arkgSeedsReducer(stateV4.arkgSeeds, newEvent),
			};
		}
	}

	return {
		...v3ops,
		walletStateReducer,
		migrateState,

		initialWalletStateContainer(): WalletStateContainer {
			const containerV3 = SchemaV3.WalletStateOperations.initialWalletStateContainer();
			return {
				...containerV3,
				S: {
					...containerV3.S,
					schemaVersion: SCHEMA_VERSION,
					arkgSeeds: [],
				},
			};
		},
	};
}

export const WalletStateOperations = createOperations(SCHEMA_VERSION, mergeStrategies);
