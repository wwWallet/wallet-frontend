import { useEffect, useMemo, useRef } from "react"
import { WalletSessionEvent, WalletStateOperations, WalletStatePresentation } from "./WalletStateOperations";
import { LocalStorageKeystore } from "./LocalStorageKeystore";
import { BackendApi } from "@/api";
import { WalletStateUtils } from "./WalletStateUtils";
import { fromBase64 } from "@/util";



export function useWalletStatePresentationsMigrationManager(keystore: LocalStorageKeystore, api: BackendApi, isOnline: boolean, isLoggedIn: boolean) {

	const migrated = useRef(false);
	const { getCalculatedWalletState, addPresentations } = keystore;
	const { get, updatePrivateData } = api;

	const getCredentialIdByCredentialIdentifier = (credentialIdentifier: string, vcEntityList: any[]) => {
		for (let i = 0; i < vcEntityList.length; i++) {
			if (credentialIdentifier === vcEntityList[i].credentialIdentifier) {
				return i;
			}
		}
	}

	const migrateVerifiablePresentationsTable = async () => {

		if (!isLoggedIn || migrated.current || getCalculatedWalletState() === null) {
			return;
		}

		if (getCalculatedWalletState().presentations.length > 0) {
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

		let transformedVpEntities: WalletStatePresentation[] = []
		vpEntityList.map(({ presentationIdentifier, presentation, presentationSubmission, includedVerifiableCredentialIdentifiers, audience, issuanceDate }) => {
			const transactionId = WalletStateUtils.getRandomUint32();
			let parsedPresentationsArray = null;
			if (presentation.startsWith("b64:")) {
				const decoded = new TextDecoder().decode(fromBase64(presentation.split("b64:")[1]));
				if (decoded.startsWith('[')) {
					parsedPresentationsArray = [...JSON.parse(decoded)];
				}
				else {
					parsedPresentationsArray = [decoded];
				}
			}
			if (!parsedPresentationsArray) {
				return;
			}
			includedVerifiableCredentialIdentifiers.map((identifier, index) => {
				transformedVpEntities.push({
					data: parsedPresentationsArray[index],
					presentationId: WalletStateUtils.getRandomUint32(),
					transactionId: transactionId,
					usedCredentialIds: [getCredentialIdByCredentialIdentifier(identifier, vcEntityList)],
					presentationTimestampSeconds: Math.floor(new Date(issuanceDate).getTime() / 1000),
					audience: audience,
				})
			})



		});
		console.log("Transformed presentations = ", transformedVpEntities)
		const [{ }, newPrivateData, keystoreCommit] = await addPresentations(transformedVpEntities);
		await updatePrivateData(newPrivateData);
		await keystoreCommit();
		migrated.current = true;
		console.log("Successfully migrated presentations");
		// receive all stored credentials from wallet-backend-server
		// update WalletStateContainer (PrivateData)
		// after successful update, delete all stored presentations from wallet-backend-server
	}

	useEffect(() => {
		if (get && updatePrivateData && getCalculatedWalletState && isOnline && !migrated.current) {
			migrateVerifiablePresentationsTable();
			console.log("migrating credentials...")
		}
	}, [get, updatePrivateData, getCalculatedWalletState, isOnline]);

	useEffect(() => {
		migrated.current = false;
	}, [isLoggedIn]);

	return useMemo(() => ({}), []);
}
