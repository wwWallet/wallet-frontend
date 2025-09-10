import * as SchemaV1 from './WalletStateSchemaVersion1';

export * from './WalletStateSchemaVersion1';


export const SCHEMA_VERSION = 2;

export const mergeStrategies: Record<SchemaV1.WalletSessionEvent["type"], SchemaV1.MergeStrategy> = {
	...SchemaV1.mergeStrategies,
	new_presentation: (a, b) => {
		const map = new Map<number, SchemaV1.WalletSessionEvent>();
		// the following line accepts all presentations with unique presentationId
		[...a, ...b].map((event: SchemaV1.WalletSessionEvent) => event.type === "new_presentation" && map.set(event.presentationId, event));
		return [...map.values()];
	},
};

export const WalletStateOperations = SchemaV1.createOperations(SCHEMA_VERSION, mergeStrategies);
