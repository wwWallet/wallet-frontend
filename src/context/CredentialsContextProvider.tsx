import React, { useState, useCallback, useContext, useRef, useEffect } from 'react';
import { getItem } from '../indexedDB';
import SessionContext from './SessionContext';
import { compareBy, reverse } from '../util';
import CredentialParserContext from './CredentialParserContext';
import { initializeCredentialEngine } from "../lib/initializeCredentialEngine";
import { CredentialVerificationError } from "wallet-common/dist/error";
import { useHttpProxy } from "@/lib/services/HttpProxy/HttpProxy";
import CredentialsContext, { ExtendedVcEntity } from "./CredentialsContext";
import { VerifiableCredentialFormat } from "wallet-common/dist/types";
import { useOpenID4VCIHelper } from "@/lib/services/OpenID4VCIHelper";
import { WalletBaseStateCredential } from '@/services/WalletStateOperations';

export const CredentialsContextProvider = ({ children }) => {
	const { api, keystore } = useContext(SessionContext);
	const [vcEntityList, setVcEntityList] = useState<ExtendedVcEntity[] | null>(null);
	const [latestCredentials, setLatestCredentials] = useState<Set<number>>(new Set());
	const [currentSlide, setCurrentSlide] = useState<number>(1);
	const { parseCredential } = useContext(CredentialParserContext);
	const httpProxy = useHttpProxy();
	const helper = useOpenID4VCIHelper();

	const [issuers, setIssuers] = useState<Record<string, unknown>[] | null>(null);

	const [isPollingActive, setIsPollingActive] = useState<boolean>(false);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		api
			.getExternalEntity("/issuer/all", undefined, true)
			.then((res) =>
				setIssuers(res.data)
			)
			.catch(() => null);
	}, [api]);

	const stopPolling = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
			setIsPollingActive(false);
			console.log("Polling stopped.");
		}
	}, []);

	const fetchVcData = useCallback(async (batchId?: number): Promise<ExtendedVcEntity[]> => {
		const credentials = await keystore.getAllCredentials();
		const presentations = await keystore.getAllPresentations();
		// Create a map of instances grouped by credentialIdentifier
		const instancesMap = credentials.reduce((acc: any, vcEntity: WalletBaseStateCredential) => {
			if (!acc[vcEntity.batchId]) {
				acc[vcEntity.batchId] = [];
			}

			acc[vcEntity.batchId].push({
				instanceId: vcEntity.instanceId,
				sigCount: presentations.filter(x => x.usedCredentialIds.includes(vcEntity.credentialId)).length,
			});
			return acc;
		}, {});

		const { sdJwtVerifier, msoMdocVerifier } = await initializeCredentialEngine(httpProxy, helper, issuers, []);

		// Filter and map the fetched list in one go
		let filteredVcEntityList = await Promise.all(
			credentials
				.filter((vcEntity) => {
					// Apply filtering by batchId if provided
					if (batchId && vcEntity.batchId !== batchId) {
						return false;
					}
					// Include only the first instance (instanceId === 0)
					return vcEntity.instanceId === 0;
				})
				.map(async (vcEntity) => {
					// Parse the credential to get parsedCredential
					const parsedCredential = await parseCredential(vcEntity.data);
					if (parsedCredential === null) { // filter out the non parsable credentials
						return null;
					}
					const result = await (async () => {
						switch (parsedCredential.metadata.credential.format) {
							case VerifiableCredentialFormat.VC_SDJWT:
								return sdJwtVerifier.verify({ rawCredential: vcEntity.data, opts: {} });
							case VerifiableCredentialFormat.MSO_MDOC:
								return msoMdocVerifier.verify({ rawCredential: vcEntity.data, opts: {} });
						}
					})();

					// Attach the instances array from the map and add parsedCredential
					return {
						...vcEntity,
						instances: instancesMap[vcEntity.batchId],
						parsedCredential,
						isExpired: result.success === false && result.error === CredentialVerificationError.ExpiredCredential,
					};
				})
		);
		filteredVcEntityList = filteredVcEntityList.filter((vcEntity) => vcEntity !== null);

		// Sorting by id
		filteredVcEntityList.reverse();
		return filteredVcEntityList;
	}, [api, parseCredential, httpProxy, issuers, helper, keystore]);

	const updateVcListAndLatestCredentials = (vcEntityList: ExtendedVcEntity[]) => {
		setLatestCredentials(new Set(vcEntityList.filter(vc => vc.batchId === vcEntityList[0].batchId).map(vc => vc.batchId)));

		setTimeout(() => {
			setLatestCredentials(new Set());
		}, 2000);

		setVcEntityList(vcEntityList);
	};


	const getData = useCallback(async (shouldPoll = false) => {
		try {
			const vcEntityList = await fetchVcData();
			console.log("Vc entity list = ", vcEntityList)
			setVcEntityList(vcEntityList);
		} catch (error) {
			console.error('Failed to fetch data', error);
		}
	}, [api, fetchVcData, stopPolling]);

	useEffect(() => {
		getData();
	}, [getData, setVcEntityList, keystore]);

	return (
		<CredentialsContext.Provider value={{ vcEntityList, latestCredentials, fetchVcData, getData, currentSlide, setCurrentSlide, parseCredential }}>
			{children}
		</CredentialsContext.Provider>
	);
}

