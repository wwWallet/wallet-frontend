import { useEffect, useMemo, useRef } from "react"
import { WalletBaseStateCredential, WalletBaseStatePresentation, WalletSessionEvent, WalletStateOperations } from "./WalletStateOperations";
import { LocalStorageKeystore } from "./LocalStorageKeystore";
import { BackendApi } from "@/api";
import { WalletStateUtils } from "./WalletStateUtils";



export function useWalletStatePresentationsMigrationManager(keystore: LocalStorageKeystore, api: BackendApi, isOnline: boolean, isLoggedIn: boolean) {

	const migrated = useRef(false);

	const getCredentialIdByCredentialIdentifier = (credentialIdentifier: string, vcEntityList: any[]) => {
		for (let i = 0; i < vcEntityList.length; i++) {
			if (credentialIdentifier === vcEntityList[i].credentialIdentifier) {
				return i;
			}
		}
	}

	const migrateVerifiablePresentationsTable = async () => {

		if (!isLoggedIn || migrated.current) {
			return;
		}
		console.log("State = ", keystore.getCalculatedWalletState().presentations)
		if (keystore.getCalculatedWalletState().presentations.length > 0) {
			migrated.current = true;
			return;
		}


		const response = await api.get('/storage/vp');
		const vpEntityList = response.data.vp_list;
		if (vpEntityList.length === 0) {
			migrated.current = true;
			return;
		}

		const fetchVcResponse = await api.get('/storage/vc');
		const vcEntityList = fetchVcResponse.data.vc_list;

		let transformedVpEntities: WalletBaseStatePresentation[] = []
		vpEntityList.map(({ presentationIdentifier, presentation, presentationSubmission, includedVerifiableCredentialIdentifiers, audience, issuanceDate }) => {
			const transactionId = WalletStateUtils.getRandomUint32();
			includedVerifiableCredentialIdentifiers.map((identifier) => {
				transformedVpEntities.push({
					data: presentation,
					presentationId: WalletStateUtils.getRandomUint32(),
					transactionId: transactionId,
					usedCredentialIds: [getCredentialIdByCredentialIdentifier(identifier, vcEntityList)],
					timestamp: Math.floor(new Date(issuanceDate).getTime() / 1000),
					audience: audience,
				})
			})



		});
		console.log("Transformed presentations = ", transformedVpEntities)
		const [{ }, newPrivateData, keystoreCommit] = await keystore.addPresentations(transformedVpEntities);
		await api.updatePrivateData(newPrivateData);
		await keystoreCommit();
		migrated.current = true;
		console.log("Successfully migrated presentations");
		// receive all stored credentials from wallet-backend-server
		// update WalletStateContainer (PrivateData)
		// after successful update, delete all stored presentations from wallet-backend-server
	}

	useEffect(() => {
		if (api && keystore && isOnline && !migrated.current) {
			migrateVerifiablePresentationsTable();
			console.log("migrating credentials...")
		}
	}, [api, keystore, isOnline]);

	return useMemo(() => ({}), []);
}
