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

export const CredentialsContextProvider = ({ children }) => {
	const { api } = useContext(SessionContext);
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

	const fetchVcData = useCallback(async (credentialId?: string): Promise<ExtendedVcEntity[]> => {
		const response = await api.get('/storage/vc');
		const fetchedVcList = response.data.vc_list;

		// Create a map of instances grouped by credentialIdentifier
		const instancesMap = fetchedVcList.reduce((acc, vcEntity) => {
			if (!acc[vcEntity.credentialIdentifier]) {
				acc[vcEntity.credentialIdentifier] = [];
			}
			acc[vcEntity.credentialIdentifier].push({
				instanceId: vcEntity.instanceId,
				sigCount: vcEntity.sigCount
			});
			return acc;
		}, {});

		const { sdJwtVerifier, msoMdocVerifier } = await initializeCredentialEngine(httpProxy, helper, issuers, []);

		// Filter and map the fetched list in one go
		let filteredVcEntityList = await Promise.all(
			fetchedVcList
				.filter((vcEntity) => {
					// Apply filtering by credentialId if provided
					if (credentialId && vcEntity.credentialIdentifier !== credentialId) {
						return false;
					}
					// Include only the first instance (instanceId === 0)
					return vcEntity.instanceId === 0;
				})
				.map(async (vcEntity) => {
					// Parse the credential to get parsedCredential
					const parsedCredential = await parseCredential(vcEntity.credential);
					if (parsedCredential === null) { // filter out the non parsable credentials
						return null;
					}
					const result = await (async () => {
						switch (parsedCredential.metadata.credential.format) {
							case VerifiableCredentialFormat.VC_SDJWT:
								return sdJwtVerifier.verify({ rawCredential: vcEntity.credential, opts: {} });
							case VerifiableCredentialFormat.MSO_MDOC:
								return msoMdocVerifier.verify({ rawCredential: vcEntity.credential, opts: {} });
						}
					})();

					// Attach the instances array from the map and add parsedCredential
					return {
						...vcEntity,
						instances: instancesMap[vcEntity.credentialIdentifier],
						parsedCredential,
						isExpired: result.success === false && result.error === CredentialVerificationError.ExpiredCredential,
					};
				})
		);
		filteredVcEntityList = filteredVcEntityList.filter((vcEntity) => vcEntity !== null);

		// Sorting by id
		filteredVcEntityList.sort(reverse(compareBy((vc) => vc.id)));
		return filteredVcEntityList;
	}, [api, parseCredential, httpProxy, issuers, helper]);

	const updateVcListAndLatestCredentials = (vcEntityList: ExtendedVcEntity[]) => {
		setLatestCredentials(new Set(vcEntityList.filter(vc => vc.id === vcEntityList[0].id).map(vc => vc.id)));

		setTimeout(() => {
			setLatestCredentials(new Set());
		}, 2000);

		setVcEntityList(vcEntityList);
	};

	const pollForCredentials = useCallback(() => {
		if (isPollingActive) {
			console.log('Polling is already active. Restarting polling.');
			stopPolling();
		}

		setIsPollingActive(true);
		let attempts = 0;
		intervalRef.current = setInterval(async () => {
			attempts += 1;
			const userId = api.getSession().uuid;
			const previousVcList = await getItem("vc", userId);
			const previousSize = previousVcList.vc_list.length;

			const vcEntityList = await fetchVcData();
			if (previousSize < vcEntityList.length) {
				console.log('Found new credentials, stopping polling');
				stopPolling();
				updateVcListAndLatestCredentials(vcEntityList);
			}

			if (attempts >= 5) {
				console.log('Max attempts reached, stopping polling');
				stopPolling();
			}
		}, 1000);
	}, [api, fetchVcData, isPollingActive, stopPolling]);

	const getData = useCallback(async (shouldPoll = false) => {
		try {
			const userId = api.getSession().uuid;
			const previousVcList = await getItem("vc", userId);
			const uniqueIdentifiers = new Set(previousVcList?.vc_list.map(vc => vc.credentialIdentifier));
			const previousSize = uniqueIdentifiers.size;

			const vcEntityList = await fetchVcData();
			const newCredentialsFound = previousSize < vcEntityList.length;

			if (shouldPoll && !newCredentialsFound) {
				window.history.replaceState({}, '', `/`);
				console.log("No new credentials, starting polling");
				setVcEntityList(vcEntityList);
				pollForCredentials();
			} else if (newCredentialsFound) {
				window.history.replaceState({}, '', `/`);
				stopPolling();
				console.log("Found new credentials, no need to poll");
				updateVcListAndLatestCredentials(vcEntityList);
			} else {
				setVcEntityList(vcEntityList);
			}
		} catch (error) {
			console.error('Failed to fetch data', error);
		}
	}, [api, fetchVcData, pollForCredentials, stopPolling]);

	return (
		<CredentialsContext.Provider value={{ vcEntityList, latestCredentials, fetchVcData, getData, currentSlide, setCurrentSlide, parseCredential }}>
			{children}
		</CredentialsContext.Provider>
	);
};
