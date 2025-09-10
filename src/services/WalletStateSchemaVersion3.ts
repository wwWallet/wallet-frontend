import * as SchemaV2 from './WalletStateSchemaVersion2';

export * from './WalletStateSchemaVersion2';


export const SCHEMA_VERSION = 3;

export const mergeStrategies: Record<SchemaV2.WalletSessionEvent["type"], SchemaV2.MergeStrategy> = {
	...SchemaV2.mergeStrategies,
	delete_presentation: (a, b) => {
		const map = new Map<number, SchemaV2.WalletSessionEvent>();
		// similar to new_presentation
		[...a, ...b].forEach((event: SchemaV2.WalletSessionEvent) => event.type === "delete_presentation" && map.set(event.presentationId, event));
		return [...map.values()];
	},
};

export const WalletStateOperations = SchemaV2.createOperations(SCHEMA_VERSION, mergeStrategies);
