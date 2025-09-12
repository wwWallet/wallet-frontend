import React, { useState, useCallback, useContext, useRef, useEffect } from 'react';
import { getItem } from '../indexedDB';
import SessionContext from './SessionContext';
import { compareBy, reverse } from '../util';
import { initializeCredentialEngine } from "../lib/initializeCredentialEngine";
import { CredentialVerificationError } from "wallet-common/dist/error";
import { useHttpProxy } from "@/lib/services/HttpProxy/HttpProxy";
import CredentialsContext, { ExtendedVcEntity } from "./CredentialsContext";
import { VerifiableCredentialFormat } from "wallet-common/dist/types";
import { useOpenID4VCIHelper } from "@/lib/services/OpenID4VCIHelper";
import { ParsedCredential } from "wallet-common/dist/types";

export const CredentialsContextProvider = ({ children }) => {
	const { api, isLoggedIn } = useContext(SessionContext);
	const [vcEntityList, setVcEntityList] = useState<ExtendedVcEntity[] | null>(null);
	const [latestCredentials, setLatestCredentials] = useState<Set<number>>(new Set());
	const [currentSlide, setCurrentSlide] = useState<number>(1);
	const httpProxy = useHttpProxy();
	const helper = useOpenID4VCIHelper();

	const [isPollingActive, setIsPollingActive] = useState<boolean>(false);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	const [credentialEngine, setCredentialEngine] = useState<any | null>(null);
	// const engineRef = useRef<any>(null);
	const prevIsLoggedIn = useRef<boolean>(null);

	const { getExternalEntity, getSession, get } = api;

	const initializeEngine = useCallback(async (useCache: boolean) => {
		const trustedCertificates: string[] = [];

		const engine = await initializeCredentialEngine(
			httpProxy,
			helper,
			() => getExternalEntity("/issuer/all", undefined, useCache).then(res => res.data),
			trustedCertificates,
			useCache,
			(issuerIdentifier: string) => {
				console.log(`[CredentialsContext] Issuer metadata resolved for: ${issuerIdentifier}`);
			}
		);
		setCredentialEngine(engine);
	}, [httpProxy, helper, getExternalEntity]);

	useEffect(() => {
		if (httpProxy && helper) {
			if (prevIsLoggedIn.current === false && isLoggedIn === true) {
				console.log("[CredentialsContext] Detected login transition, initializing without cache");
				initializeEngine(false);
			} else if (isLoggedIn) {
				console.log("[CredentialsContext] Initializing on first load with cache");
				initializeEngine(true);
			}
		}
		prevIsLoggedIn.current = isLoggedIn;
	}, [isLoggedIn, httpProxy, helper]);

	const stopPolling = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
			setIsPollingActive(false);
			console.log("Polling stopped.");
		}
	}, []);

	const parseCredential = useCallback(async (rawCredential: unknown): Promise<ParsedCredential | null> => {
		const engine = credentialEngine;
		if (!engine) return null;
		try {
			const result = await engine.credentialParsingEngine.parse({ rawCredential });
			if (result.success) {
				return result.value;
			}
			return null;
		}
		catch (err) {
			console.error(err);
			return null;
		}

	}, [credentialEngine]);

	const fetchVcData = useCallback(async (credentialId?: string): Promise<ExtendedVcEntity[]> => {
		const engine = credentialEngine;
		if (!engine) return [];

		const response = await get('/storage/vc');
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

		const { jptVerifier, sdJwtVerifier, msoMdocVerifier } = engine;
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
							case VerifiableCredentialFormat.DC_JPT:
								return jptVerifier.verify({ rawCredential: vcEntity.credential, opts: {} });
								return { success: true };
							case VerifiableCredentialFormat.VC_SDJWT:
								return sdJwtVerifier.verify({ rawCredential: vcEntity.credential, opts: {} });
							case VerifiableCredentialFormat.DC_SDJWT:
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
	}, [get, parseCredential, credentialEngine]);

	const updateVcListAndLatestCredentials = useCallback(
		(newVcEntityList: ExtendedVcEntity[], setLatest: boolean) => {
			if (setLatest && newVcEntityList.length > 0) {
				setLatestCredentials(new Set(newVcEntityList.filter(vc => vc.id === newVcEntityList[0].id).map(vc => vc.id)));

				setTimeout(() => {
					setLatestCredentials(new Set());
				}, 2000);
			}

			setVcEntityList((prev) => {
				if (
					!prev ||
					prev.length !== newVcEntityList.length ||
					prev.some((vc, i) => vc.id !== newVcEntityList[i].id)
				) {
					return newVcEntityList;
				}
				return prev;
			});
		},
		[setVcEntityList, setLatestCredentials]
	);

	const pollForCredentials = useCallback(() => {
		if (isPollingActive) {
			console.log('Polling is already active. Restarting polling.');
			stopPolling();
		}

		setIsPollingActive(true);
		let attempts = 0;
		intervalRef.current = setInterval(async () => {
			attempts += 1;
			const userId = getSession().uuid;
			const previousVcList = await getItem("vc", userId);
			const previousSize = previousVcList.vc_list.length;

			const vcEntityList = await fetchVcData();
			if (previousSize < vcEntityList.length) {
				console.log('Found new credentials, stopping polling');
				stopPolling();
				updateVcListAndLatestCredentials(vcEntityList, true);
			}

			if (attempts >= 5) {
				console.log('Max attempts reached, stopping polling');
				stopPolling();
			}
		}, 1000);
	}, [getSession, fetchVcData, isPollingActive, stopPolling]);

	const getData = useCallback(async (shouldPoll = false) => {
		try {
			const userId = getSession().uuid;
			const previousVcList = await getItem("vc", userId);
			const uniqueIdentifiers = new Set(previousVcList?.vc_list.map(vc => vc.credentialIdentifier));
			const previousSize = uniqueIdentifiers.size;

			const newVcEntityList = await fetchVcData();
			const newCredentialsFound = previousSize < newVcEntityList.length;

			if (shouldPoll && !newCredentialsFound) {
				window.history.replaceState({}, '', `/`);
				console.log("No new credentials, starting polling");
				setVcEntityList(newVcEntityList);
				updateVcListAndLatestCredentials(newVcEntityList, false);
				pollForCredentials();
			} else if (newCredentialsFound) {
				window.history.replaceState({}, '', `/`);
				stopPolling();
				console.log("Found new credentials, no need to poll");
				updateVcListAndLatestCredentials(newVcEntityList, true);
			} else {
				updateVcListAndLatestCredentials(newVcEntityList, false);
			}
		} catch (error) {
			console.error('Failed to fetch data', error);
		}
	}, [getSession, fetchVcData, pollForCredentials, stopPolling]);

	if (isLoggedIn && !credentialEngine) {
		return (
			<></>
		);
	}
	else {
		return (
			<CredentialsContext.Provider value={{ vcEntityList, latestCredentials, fetchVcData, getData, currentSlide, setCurrentSlide, parseCredential, credentialEngine }}>
				{children}
			</CredentialsContext.Provider>
		);
	}
};
