import React, { createContext, useState, useCallback, useContext } from 'react';
import { getItem } from '../indexedDB';
import SessionContext from './SessionContext';
import { compareBy, reverse } from '../util';
import CredentialParserContext from "./CredentialParserContext";
import { initializeCredentialEngine } from "../lib/initializeCredentialEngine";
import { CredentialVerificationError } from 'core/dist/error';
import { useHttpProxy } from '../lib/services/HttpProxy/HttpProxy';
const CredentialsContext = createContext();

export const CredentialsProvider = ({ children }) => {
	const { api } = useContext(SessionContext);
	const [vcEntityList, setVcEntityList] = useState(null);
	const [latestCredentials, setLatestCredentials] = useState(new Set());
	const [currentSlide, setCurrentSlide] = useState(1);
	const { parseCredential } = useContext(CredentialParserContext);
	const httpProxy = useHttpProxy();

	const fetchVcData = useCallback(async (credentialId = null) => {
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

		// Filter and map the fetched list in one go
		const filteredVcEntityList = await Promise.all(
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
					const credentialEngine = initializeCredentialEngine(httpProxy);
					const result = await credentialEngine.verifyingEngine.verify({ rawCredential: vcEntity.credential, opts: {} });
					// Attach the instances array from the map and add parsedCredential
					return {
						...vcEntity,
						instances: instancesMap[vcEntity.credentialIdentifier],
						parsedCredential,
						isExpired: result.success === false && result.error === CredentialVerificationError.ExpiredCredential,
					};
				})
		);

		// Sorting by id
		filteredVcEntityList.sort(reverse(compareBy((vc) => vc.id)));
		return filteredVcEntityList;
	}, [api, parseCredential]);

	const updateVcListAndLatestCredentials = (vcEntityList) => {
		setLatestCredentials(new Set(vcEntityList.filter(vc => vc.id === vcEntityList[0].id).map(vc => vc.id)));

		setTimeout(() => {
			setLatestCredentials(new Set());
		}, 2000);

		setVcEntityList(vcEntityList);
	};

	const pollForCredentials = useCallback(() => {
		let attempts = 0;
		let isPolling = true;
		const intervalId = setInterval(async () => {
			if (!isPolling) {
				clearInterval(intervalId);
				return;
			}

			attempts += 1;
			const userId = api.getSession().uuid;
			const previousVcList = await getItem("vc", userId);
			const previousSize = previousVcList.vc_list.length;

			const vcEntityList = await fetchVcData();

			if (previousSize < vcEntityList.length) {
				console.log('Found new credentials, stopping polling');
				isPolling = false;
				clearInterval(intervalId);
				updateVcListAndLatestCredentials(vcEntityList);
			}

			if (attempts >= 5) {
				console.log('Max attempts reached, stopping polling');
				isPolling = false;
				clearInterval(intervalId);
			}
		}, 1000);
	}, [api, fetchVcData]);

	const getData = useCallback(async (shouldPoll = false) => {
		try {
			const userId = api.getSession().uuid;
			const previousVcList = await getItem("vc", userId);
			const uniqueIdentifiers = new Set(previousVcList?.vc_list.map(vc => vc.credentialIdentifier));
			const previousSize = uniqueIdentifiers.size;

			const vcEntityList = await fetchVcData();

			setVcEntityList(vcEntityList);

			const newCredentialsFound = previousSize < vcEntityList.length;
			if (shouldPoll && !newCredentialsFound) {
				window.history.replaceState({}, '', `/`);
				console.log("No new credentials, starting polling");
				pollForCredentials();
			} else if (newCredentialsFound) {
				window.history.replaceState({}, '', `/`);
				console.log("Found new credentials, no need to poll");
				updateVcListAndLatestCredentials(vcEntityList);
			} else {
				setVcEntityList(vcEntityList);
			}
		} catch (error) {
			console.error('Failed to fetch data', error);
		}
	}, [api, fetchVcData, pollForCredentials]);

	return (
		<CredentialsContext.Provider value={{ vcEntityList, latestCredentials, fetchVcData, getData, currentSlide, setCurrentSlide, parseCredential }}>
			{children}
		</CredentialsContext.Provider>
	);
};

export const withCredentialsContext = (Component) =>
	(props) => (
		<CredentialsProvider>
			<Component {...props} />
		</CredentialsProvider>
	);
export default CredentialsContext;
