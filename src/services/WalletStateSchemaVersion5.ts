import * as cbor from 'cbor-web';

import * as SchemaV3 from './WalletStateSchemaVersion3';
import * as SchemaV4 from './WalletStateSchemaVersion4';
import * as WalletSchemaCommon from './WalletStateSchemaCommon';
import { toU8 } from '@/util';
import { COSE_ALG_ESP256_ARKG, ParsedCOSEKeyArkgPubSeed } from 'wallet-common/dist/cose';

export * from './WalletStateSchemaVersion4';


export const SCHEMA_VERSION = 5;

type CredentialKeyPairCommon = Omit<SchemaV3.CredentialKeyPair, "privateKey">;
export type CredentialKeyPairWithCleartextPrivateKey = SchemaV3.CredentialKeyPair;
export type CredentialKeyPairWithExternalPrivateKey = CredentialKeyPairCommon & {
	externalPrivateKey: WebauthnSignPrivateKey,
}
export type CredentialKeyPair = CredentialKeyPairWithCleartextPrivateKey | CredentialKeyPairWithExternalPrivateKey;

export type WebauthnSignArkgPublicSeed = {
	credentialId: Uint8Array,
	publicSeed: ParsedCOSEKeyArkgPubSeed,
	keyHandle: Uint8Array,
	derivedKeyAlgorithm: COSEAlgorithmIdentifier,
}

type WebauthnSignPrivateKeyCommon = {
	credentialId: Uint8Array,
	keyHandle: Uint8Array,
	algorithm: COSEAlgorithmIdentifier,
};

export type WebauthnSignPrivateKeyArkg = WebauthnSignPrivateKeyCommon & {
	additionalArgs: {
		kh: Uint8Array,
		ctx: Uint8Array,
	},
}
export type WebauthnSignPrivateKey = WebauthnSignPrivateKeyArkg;

export type WalletStateContainer = {
	events: WalletSessionEvent[];
	S: WalletStateV5OrEarlier;
	lastEventHash: string;
};
export type WalletSessionEventV5 = WalletSchemaCommon.WalletSessionEvent & WalletSessionEventTypeAttributesV5;
export type WalletSessionEventV5OrEarlier = SchemaV4.WalletSessionEvent | WalletSessionEventV5;
export type WalletSessionEvent = WalletSessionEventV5OrEarlier;

export type WalletSessionEventTypeAttributes = (
	SchemaV4.WalletSessionEventTypeAttributes
	| WalletSessionEventTypeAttributesV5
);

export type WalletSessionEventTypeAttributesV5 = WalletSessionEventNewKeypair | WalletSessionEventNewArkgSeed;

export type WalletSessionEventNewKeypair = Omit<SchemaV4.WalletSessionEventNewKeypair, "keypair"> & {
	keypair: CredentialKeyPair,
}

export type WalletSessionEventNewArkgSeed = Omit<SchemaV4.WalletSessionEventNewArkgSeed, "arkgSeed"> & {
	arkgSeed: WebauthnSignArkgPublicSeed,
}

export type WalletStateV5 = Omit<SchemaV4.WalletState, "keypairs" | "arkgSeeds"> & {
	keypairs: {
		kid: string,
		keypair: CredentialKeyPair,
	}[],
	arkgSeeds: SchemaV4.MaybeNamed<WebauthnSignArkgPublicSeed>[],
}
export type WalletStateV5OrEarlier = SchemaV4.WalletStateV4OrEarlier | WalletStateV5;
export type WalletState = WalletStateV5;

function isLegacyState(state: WalletStateV5OrEarlier): state is SchemaV4.WalletStateV4OrEarlier {
	return state.schemaVersion < SCHEMA_VERSION;
}

export function createOperations<Event extends WalletSchemaCommon.WalletSessionEvent>(
	SCHEMA_VERSION: number,
	mergeStrategies: Record<Event["type"], SchemaV4.MergeStrategy>,
) {
	const v4ops = SchemaV4.createOperations(SCHEMA_VERSION, mergeStrategies as typeof SchemaV4.mergeStrategies);

	function migrateState(state: WalletStateV5OrEarlier): WalletState {
		if (isLegacyState(state)) {
			const v4state = SchemaV4.WalletStateOperations.migrateState(state);
			return {
				...v4state,
				schemaVersion: SCHEMA_VERSION,
				keypairs: v4state.keypairs.map(({ kid, keypair }) => {
					if ("externalPrivateKey" in keypair) {
						const keyRef = cbor.decode(keypair.externalPrivateKey.keyRef);
						return {
							kid,
							keypair: {
								...keypair,
								externalPrivateKey: {
									credentialId: keypair.externalPrivateKey.credentialId,
									keyHandle: toU8(keyRef.get(2)),
									algorithm: keyRef.get(3) as COSEAlgorithmIdentifier,
									additionalArgs: {
										kh: toU8(keyRef.get(-1)),
										ctx: toU8(keyRef.get(-2)),
									},
								},
							},
						};
					} else {
						return { kid, keypair };
					}
				}),
				arkgSeeds: v4state.arkgSeeds.map((arkgSeed) => ({
					credentialId: arkgSeed.credentialId,
					publicSeed: {
						kty: arkgSeed.publicSeed.kty,
						alg: arkgSeed.publicSeed.alg,
						pkBl: arkgSeed.publicSeed.pkBl,
						pkKem: arkgSeed.publicSeed.pkKem,
						...(arkgSeed.publicSeed.dkalg ? { dkalg: arkgSeed.publicSeed.dkalg } : {}),
					},
					keyHandle: arkgSeed.publicSeed.kid,
					derivedKeyAlgorithm: arkgSeed.publicSeed.dkalg ?? COSE_ALG_ESP256_ARKG,
				})),
			};
		} else {
			return state;
		}
	}

	function walletStateReducer(
		state: WalletStateV5OrEarlier,
		newEvent: WalletSessionEvent,
	): WalletStateV5OrEarlier {
		// Runtime behaviour is identical between version 4 and 5. The only
		// differences are the internal formats of `keypairs[].keypair` and
		// `newEvent.arkgSeed`, but the v4 reducer simply copies those fields.
		// So we can just coerce the types.
		return SchemaV4.WalletStateOperations.walletStateReducer(
			state as SchemaV4.WalletState,
			newEvent as SchemaV4.WalletSessionEvent,
		);
	}

	return {
		...v4ops,
		walletStateReducer,
		migrateState,

		initialWalletStateContainer(): WalletStateContainer {
			const containerV4 = SchemaV4.WalletStateOperations.initialWalletStateContainer();
			return {
				...containerV4,
				S: {
					...containerV4.S,
					schemaVersion: SCHEMA_VERSION,
					arkgSeeds: [],
				},
			};
		},
	};
}

export const WalletStateOperations = createOperations(SCHEMA_VERSION, SchemaV4.mergeStrategies);
