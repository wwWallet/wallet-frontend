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

export interface WalletStateOperations<S extends WalletState, E extends WalletSessionEvent> {
	initialWalletStateContainer(): WalletStateContainer<S, E>;
	migrateState(state: WalletState): S;
	walletStateReducer(state: S, newEvent: E): S;
	calculateEventHash(event: E): Promise<string>;
	mergeDivergentHistoriesWithStrategies(historyA: E[], historyB: E[], lastCommonAncestorHashFromEventHistory: string): Promise<E[]>;
}
