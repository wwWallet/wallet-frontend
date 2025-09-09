import {
	SCHEMA_VERSION,
	WalletState,
} from "./WalletStateSchema";


export namespace WalletStateMigrations {


	export function migrateWalletStateToCurrent(state: WalletState): WalletState {
		while (state.schemaVersion < SCHEMA_VERSION) {
			state = migrateWalletStateTo(state.schemaVersion + 1, state);
		}
		return state;
	}

	export function migrateWalletStateTo(targetVersion: number, state: WalletState): WalletState {
		switch (targetVersion) {
			default:
				throw new Error(`No migration available for target version ${targetVersion}`);
		}
	}
}
