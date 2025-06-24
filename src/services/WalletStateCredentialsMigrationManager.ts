import { useEffect, useMemo, useRef } from "react"
import { WalletBaseStateCredential, WalletSessionEvent, WalletStateOperations } from "./WalletStateOperations";
import { LocalStorageKeystore } from "./LocalStorageKeystore";
import { BackendApi } from "@/api";



export function useWalletStateCredentialsMigrationManager(keystore: LocalStorageKeystore, api: BackendApi, isOnline: boolean, isLoggedIn: boolean) {

	const migrated = useRef(false);

	const migrateVerifiableCredentialTable = async () => {

		if (!isLoggedIn || migrated.current) {
			return;
		}
		console.log("State = ", keystore.getCalculatedWalletState().credentials)
		if (keystore.getCalculatedWalletState().credentials.length > 0) {
			migrated.current = true;
			return;
		}

		const response = await api.get('/storage/vc');
		const vcEntityList = response.data.vc_list;
		if (vcEntityList.length === 0) {
			migrated.current = true;
			return;
		}

		const stringToIdMap = new Map(); // assign a batchId for each credentialIdentifier
		let id = 0;
		for (const credentialIdentifier of vcEntityList.map((cred) => cred.credentialIdentifier)) {
			if (!stringToIdMap.has(credentialIdentifier)) {
				stringToIdMap.set(credentialIdentifier, id++);
			}
		}
		const transformedVcEntities: WalletBaseStateCredential[] = vcEntityList.map(({ credential, credentialIdentifier, credentialIssuerIdentifier, format, instanceId, }, index) => {
			return {
				data: credential,
				format: format,
				credentialIssuerIdentifier: credentialIssuerIdentifier,
				instanceId: instanceId,
				batchId: stringToIdMap.get(credentialIdentifier),
				credentialId: index,
			}
		});
		console.log("Transformed credentials = ", transformedVcEntities)
		const [{}, newPrivateData, keystoreCommit] = await keystore.addCredentials(transformedVcEntities);
		await api.updatePrivateData(newPrivateData);
		await keystoreCommit();
		migrated.current = true;
		console.log("Successfully migrated credentials");
		// receive all stored credentials from wallet-backend-server
		// update WalletStateContainer (PrivateData)
		// after successful update, delete all stored credentials from wallet-backend-server
	}

	useEffect(() => {
		if (api && keystore && isOnline && !migrated.current) {
			migrateVerifiableCredentialTable();
			console.log("migrating credentials...")
		}
	}, [api, keystore, isOnline]);

	return useMemo(() => ({ }), []);
}
