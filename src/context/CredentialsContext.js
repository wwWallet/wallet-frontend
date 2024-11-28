import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import { getItem } from '../indexedDB';
import SessionContext from './SessionContext';
import { compareBy, reverse } from '../util';

const CredentialsContext = createContext();

export const CredentialsProvider = ({ children }) => {
	const { api } = useContext(SessionContext);
	const [vcEntityList, setVcEntityList] = useState(null);
	const [vcEntityListInstances, setVcEntityListInstances] = useState(null);
	const [latestCredentials, setLatestCredentials] = useState(new Set());
	const [currentSlide, setCurrentSlide] = useState(1);

	const fetchVcData = useCallback(async () => {
		const response = await api.get('/storage/vc');
		const fetchedVcList = response.data.vc_list;

		const vcEntityList = (await Promise.all(fetchedVcList.map(async (vcEntity) => {
			return { ...vcEntity };
		}))).filter((vcEntity) => vcEntity.instanceId == 0); // show only the first instance

		vcEntityList.sort(reverse(compareBy(vc => vc.id)));

		return { vcEntityList, fetchedVcList };
	}, [api]);

	const updateVcListAndLatestCredentials = (vcEntityList, fetchedVcList) => {
		setLatestCredentials(new Set(vcEntityList.filter(vc => vc.id === vcEntityList[0].id).map(vc => vc.id)));

		setTimeout(() => {
			setLatestCredentials(new Set());
		}, 2000);

		setVcEntityList(vcEntityList);
		setVcEntityListInstances(fetchedVcList);
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

			const { vcEntityList, fetchedVcList } = await fetchVcData();

			if (previousSize < vcEntityList.length) {
				console.log('Found new credentials, stopping polling');
				isPolling = false;
				clearInterval(intervalId);
				updateVcListAndLatestCredentials(vcEntityList, fetchedVcList);
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

			const { vcEntityList, fetchedVcList } = await fetchVcData();

			setVcEntityList(vcEntityList);
			setVcEntityListInstances(fetchedVcList);

			const newCredentialsFound = previousSize < vcEntityList.length;
			if (shouldPoll && !newCredentialsFound) {
				window.history.replaceState({}, '', `/`);
				console.log("No new credentials, starting polling");
				pollForCredentials();
			} else if (newCredentialsFound) {
				window.history.replaceState({}, '', `/`);
				console.log("Found new credentials, no need to poll");
				updateVcListAndLatestCredentials(vcEntityList, fetchedVcList);
			} else {
				setVcEntityList(vcEntityList);
				setVcEntityListInstances(fetchedVcList);
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
		<CredentialsContext.Provider value={{ vcEntityList, vcEntityListInstances, latestCredentials, getData, currentSlide, setCurrentSlide }}>
			{children}
		</CredentialsContext.Provider>
	);
};

export default CredentialsContext;
