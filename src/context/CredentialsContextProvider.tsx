import React, { useState, useCallback, useContext, useRef, useEffect } from 'react';
import { getItem } from '../indexedDB';
import SessionContext from './SessionContext';
import { compareBy, reverse, toBase64 } from '../util';
import { initializeCredentialEngine } from "../lib/initializeCredentialEngine";
import { CredentialVerificationError } from "wallet-common/dist/error";
import { useHttpProxy } from "@/lib/services/HttpProxy/HttpProxy";
import CredentialsContext, { ExtendedVcEntity, Instance } from "./CredentialsContext";
import { VerifiableCredentialFormat } from "wallet-common/dist/types";
import { useOpenID4VCIHelper } from "@/lib/services/OpenID4VCIHelper";
import { ParsedCredential } from "wallet-common/dist/types";
import { WalletStateCredential } from '@/services/WalletStateOperations';
import { useLocalStorage } from '@/hooks/useStorage';
import { WalletStateUtils } from '@/services/WalletStateUtils';
import axios from 'axios';

export type DcApiCredentialWrapperCommonSchema = {
	id: number;
	format: string;
	title: string;
	subtitle: string;
	icon: string;
	fields: Array<unknown>;
	disclaimer?: string;
	warning?: string;
}

type NativeWrapperUpdateCredentialsFn = (newList: DcApiCredentialWrapperCommonSchema[]) => void;

export const CredentialsContextProvider = ({ children }) => {
	const { api, keystore, isLoggedIn } = useContext(SessionContext);
	const [vcEntityList, setVcEntityList] = useState<ExtendedVcEntity[] | null>(null);
	const [latestCredentials, setLatestCredentials] = useState<Set<number>>(new Set());
	const [currentSlide, setCurrentSlide] = useState<number>(1);
	const httpProxy = useHttpProxy();
	const helper = useOpenID4VCIHelper();
	const credentialNumber = useRef<number | null>(null)
	const { getCalculatedWalletState } = keystore;
	const [credentialEngine, setCredentialEngine] = useState<any | null>(null);
	// const engineRef = useRef<any>(null);
	const prevIsLoggedIn = useRef<boolean>(null);

	const { getExternalEntity, getSession, get } = api;

	const [supportedDcApiCredentials, setSupportedDcApiCredentials, clear] = useLocalStorage<{ [userHandle: string]: DcApiCredentialWrapperCommonSchema[] }>("supportedDcApiCredentials", {});

	useEffect(() => {
		if (!vcEntityList || vcEntityList.length === 0 || !keystore || !helper) {
			return;
		}
		const userHandle = keystore.getUserHandleB64u();

		async function updateSupportedDcApiCreds() {
			const supportedCredentials = [];
			for (const vc of vcEntityList) {
				const { metadata } = await helper.getCredentialIssuerMetadata(vc.credentialIssuerIdentifier, true);
				const supportedCredConf = metadata.credential_configurations_supported[vc.credentialConfigurationId];
				let credType = null;
				if (supportedCredConf.format === VerifiableCredentialFormat.DC_SDJWT || supportedCredConf.format === VerifiableCredentialFormat.VC_SDJWT) {
					credType = (supportedCredConf as any).vct;
				}
				else if (supportedCredConf.format === VerifiableCredentialFormat.MSO_MDOC) {
					credType = (supportedCredConf as any).doctype;
				}
				const result = supportedCredentials.filter((cred) => cred.format === credType);
				if (result.length > 0) { // don't insert record if a record with the same credential type exists
					continue;
				}

				let icon = "";
				if (supportedCredConf?.display && supportedCredConf?.display[0] && supportedCredConf.display[0]?.background_image?.uri) {
					const uri = supportedCredConf.display[0]?.background_image?.uri;
					let icon = '';
					try {
						const img = await axios.get(uri, { responseType: 'arraybuffer' });
						const contentType = img.headers['content-type'];
						const b64data = toBase64(img.data);
						const b64UriData = `data:${contentType};base64,${b64data}`
						icon = b64UriData;
					} catch (e) {
						console.error(e);
					}
				}
				const newRandomId = WalletStateUtils.getRandomUint32();
				const supportedCredential = {
					id: newRandomId,
					fields: [],
					format: credType as string,
					icon: icon,
					title: supportedCredConf?.display && supportedCredConf?.display[0] && supportedCredConf.display[0]?.name ? supportedCredConf.display[0]?.name : "",
					subtitle: supportedCredConf?.display && supportedCredConf?.display[0] && supportedCredConf.display[0]?.description ? supportedCredConf.display[0]?.description : "",
				}
				supportedCredentials.push(supportedCredential);
			}
			setSupportedDcApiCredentials((val) => {
				val[userHandle] = supportedCredentials;
				return val;
			});
		}

		updateSupportedDcApiCreds();
	}, [keystore, vcEntityList, setSupportedDcApiCredentials, helper]);

	useEffect(() => {
		// @ts-ignore
		if (!supportedDcApiCredentials || !window.nativeWrapper || !window.nativeWrapper.updateAllCredentials) {
			return;
		}
		const aggregatedSupportedDcApiCreds = Object.values(supportedDcApiCredentials).reduce<DcApiCredentialWrapperCommonSchema[]>(
			(acc, arr) => [...acc, ...arr],
			[]
		);
		// @ts-ignore
		nativeWrapper.updateAllCredentials(JSON.stringify(aggregatedSupportedDcApiCreds));
	}, [supportedDcApiCredentials]);

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

		const { credentials } = getCalculatedWalletState();
		if (!credentials) {
			return null;
		}

		const { presentations } = getCalculatedWalletState();
		// Create a map of instances grouped by credentialIdentifier
		const instancesMap = credentials.reduce((acc: any, vcEntity: WalletStateCredential) => {
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
	}, [httpProxy, helper, getCalculatedWalletState, get, parseCredential, credentialEngine]);


	const getData = useCallback(async () => {
		try {
			const storedCredentials = await fetchVcData();
			if (storedCredentials != null && (credentialNumber.current !== null && storedCredentials.length > credentialNumber.current)) {
				setLatestCredentials(storedCredentials.length > 0 ? new Set([storedCredentials[0].batchId]) : new Set());
				setTimeout(() => {
					setLatestCredentials(new Set());
				}, 2000);
			}
			setVcEntityList((prev) => {
				if (
					!prev ||
					prev.length !== storedCredentials.length ||
					prev.some((vc, i) => vc.id !== storedCredentials[i].id)
				) {
					return storedCredentials;
				}
				return prev;
			});
			credentialNumber.current = storedCredentials?.length;

		} catch (error) {
			console.error('Failed to fetch data', error);
		}
	}, [getSession, fetchVcData, setVcEntityList]);

	useEffect(() => {
		if (!getCalculatedWalletState || !credentialEngine || !isLoggedIn) {
			return;
		}
		console.log("Triggerring getData()", getCalculatedWalletState())
		getData();
	}, [getData, getCalculatedWalletState, credentialEngine, isLoggedIn]);

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
