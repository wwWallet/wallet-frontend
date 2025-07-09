import React, { useState, useCallback, useContext, useRef, useEffect } from 'react';
import { getItem } from '../indexedDB';
import SessionContext from './SessionContext';
import { compareBy, reverse } from '../util';
import { initializeCredentialEngine } from "../lib/initializeCredentialEngine";
import { CredentialVerificationError } from "wallet-common/dist/error";
import { useHttpProxy } from "@/lib/services/HttpProxy/HttpProxy";
import CredentialsContext, { ExtendedVcEntity, Instance } from "./CredentialsContext";
import { VerifiableCredentialFormat } from "wallet-common/dist/types";
import { useOpenID4VCIHelper } from "@/lib/services/OpenID4VCIHelper";
import { WalletBaseStateCredential } from '@/services/WalletStateOperations';
import { ParsedCredential } from "wallet-common/dist/types";

export const CredentialsContextProvider = ({ children }) => {
	const { api, keystore, isLoggedIn } = useContext(SessionContext);
	const [vcEntityList, setVcEntityList] = useState<ExtendedVcEntity[] | null>(null);
	const [latestCredentials, setLatestCredentials] = useState<Set<number>>(new Set());
	const [currentSlide, setCurrentSlide] = useState<number>(1);
	const httpProxy = useHttpProxy();
	const helper = useOpenID4VCIHelper();
	const credentialNumber = useRef<number | null>(null)

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

	const fetchVcData = useCallback(async (batchId?: number): Promise<ExtendedVcEntity[] | null> => {
		const engine = credentialEngine;
		if (!engine) return null;

		const credentials = await keystore.getAllCredentials();
		console.log("Creds = ", credentials)
		if (!credentials) {
			return null;
		}
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

		const { sdJwtVerifier, msoMdocVerifier } = engine;
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
							case VerifiableCredentialFormat.DC_SDJWT:
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
						sigCount: instancesMap[vcEntity.batchId].reduce((acc: number, curr: Instance) =>
							acc + curr.sigCount
							, 0),
					};
				})
		);
		filteredVcEntityList = filteredVcEntityList.filter((vcEntity) => vcEntity !== null);

		// Sorting by id
		filteredVcEntityList.reverse();
		return filteredVcEntityList;
	}, [parseCredential, httpProxy, helper, keystore, get, parseCredential, credentialEngine]);

	// const updateVcListAndLatestCredentials = (vcEntityList: ExtendedVcEntity[]) => {
	// 	setLatestCredentials(new Set(vcEntityList.filter(vc => vc.id === vcEntityList[0].id).map(vc => vc.id)));

	// 	setTimeout(() => {
	// 		setLatestCredentials(new Set());
	// 	}, 2000);

	// 	setVcEntityList(vcEntityList);
	// };

	const getData = useCallback(async (shouldPoll = false) => {
		try {
			const storedCredentials = await fetchVcData();
			if (storedCredentials != null && (credentialNumber.current === null || storedCredentials.length > credentialNumber.current)) {
				setLatestCredentials(storedCredentials.length > 0 ? new Set([storedCredentials[0].batchId]) : new Set());
				setTimeout(() => {
					setLatestCredentials(new Set());
				}, 2000);
			}
			setVcEntityList(storedCredentials);

			credentialNumber.current = storedCredentials.length;

		} catch (error) {
			console.error('Failed to fetch data', error);
		}
	}, [getSession, fetchVcData, setVcEntityList]);

	useEffect(() => {
		if (!keystore || !credentialEngine || !isLoggedIn) {
			return;
		}
		console.log("Triggerring getData()", keystore.getCalculatedWalletState())
		getData();
	}, [getData, keystore, credentialEngine, isLoggedIn]);

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
