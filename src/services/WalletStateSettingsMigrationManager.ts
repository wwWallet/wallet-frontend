import { useEffect, useMemo, useRef } from "react"
import { LocalStorageKeystore } from "./LocalStorageKeystore";
import { BackendApi } from "@/api";



export function useWalletStateSettingsMigrationManager(keystore: LocalStorageKeystore, api: BackendApi, isOnline: boolean, isLoggedIn: boolean) {

	const migrated = useRef(false);
	const migrate = async () => {
		console.log("Before")
		if (!isLoggedIn || migrated.current) {
			return;
		}

		if (keystore.getCalculatedWalletState().settings && Object.keys(keystore.getCalculatedWalletState().settings).length > 0) {
			migrated.current = true;
			return;
		}

		const response = await api.get('/user/session/account-info');

		const { settings } = response.data;
		console.log("Settings found = ", settings)
		if (!settings) {
			migrated.current = true;
			return;
		}

		const [{}, newPrivateData, keystoreCommit] = await keystore.alterSettings({ ...settings });
		await api.updatePrivateData(newPrivateData);
		await keystoreCommit();
		migrated.current = true;
		console.log("Successfully migrated settings");
		// receive all stored credentials from wallet-backend-server
		// update WalletStateContainer (PrivateData)
		// after successful update, delete all stored credentials from wallet-backend-server
	}

	useEffect(() => {
		if (api && keystore && isOnline && !migrated.current) {
			migrate();
			console.log("migrating settings...")
		}
	}, [api, keystore, isOnline]);

	useEffect(() => {
		migrated.current = false;
	}, [isLoggedIn]);

	return useMemo(() => ({ }), []);
}
