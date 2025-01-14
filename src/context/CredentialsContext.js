import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import { getItem } from '../indexedDB';
import SessionContext from './SessionContext';
import { compareBy, reverse } from '../util';

const CredentialsContext = createContext();

export const CredentialsProvider = ({ children }) => {
	const { api } = useContext(SessionContext);
	const [vcEntityList, setVcEntityList] = useState(null);
	const [latestCredentials, setLatestCredentials] = useState(new Set());
	const [currentSlide, setCurrentSlide] = useState(1);

	const fetchVcData = useCallback(async (credentialId = null) => {
		const response = await api.get('/storage/vc');
		const fetchedVcList = response.data.vc_list;

		// Group the fetched VC list by credentialIdentifier
		const groupedByCredential = fetchedVcList.reduce((acc, vcEntity) => {
			if (!acc[vcEntity.credentialIdentifier]) {
				acc[vcEntity.credentialIdentifier] = [];
			}
			// Push the current vcEntity into the group
			acc[vcEntity.credentialIdentifier].push(vcEntity);
			return acc;
		}, {});

		// Map over each group to add the `instances` field
		const vcEntityList = Object.values(groupedByCredential).map((group) => {
			const firstInstance = group[0]; // First instance for each credentialIdentifier

			// Add the instances array with all instance details
			const instances = group.map((vcEntity) => ({
				instanceId: vcEntity.instanceId,
				sigCount: vcEntity.sigCount
			}));

			// Return the first instance with the added `instances` field
			return { ...firstInstance, instances };
		});

		// If a specific credentialId is provided, filter based on it
		const filteredVcEntityList = credentialId
			? vcEntityList.filter(vc => vc.credentialIdentifier === credentialId)
			: vcEntityList;

		// Sorting the list as you did earlier
		filteredVcEntityList.sort(reverse(compareBy(vc => vc.id)));

		return filteredVcEntityList;
	}, [api]);

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

	useEffect(() => {
		const handleNewCredentialEvent = () => {
			getData(true);
		};
		window.addEventListener('newCredential', handleNewCredentialEvent);
		return () => {
			window.removeEventListener('newCredential', handleNewCredentialEvent);
		};
	}, [getData]);

	return (
		<CredentialsContext.Provider value={{ vcEntityList, latestCredentials, fetchVcData, getData, currentSlide, setCurrentSlide }}>
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
