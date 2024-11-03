import React, { createContext, useState, useCallback, useContext } from 'react';
import { getItem } from '../indexedDB';
import SessionContext from './SessionContext';
import { compareBy, reverse } from '../util';

const CredentialsContext = createContext();

export const CredentialsProvider = ({ children }) => {
	const { api } = useContext(SessionContext);
	const [vcEntityList, setVcEntityList] = useState([]);
	const [latestCredentials, setLatestCredentials] = useState(new Set());

	const fetchVcData = useCallback(async () => {
		const response = await api.get('/storage/vc');
		const fetchedVcList = response.data?.vc_list || [];

		const vcEntityList = await Promise.all(fetchedVcList.map(async vcEntity => {
			return { ...vcEntity };
		}));

		vcEntityList.sort(reverse(compareBy(vc => vc.id)));

		return vcEntityList;
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
			const previousSize = previousVcList?.vc_list.length || 0;

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

	const getData = useCallback(async () => {
		try {
			const userId = api.getSession().uuid;
			const previousVcList = await getItem("vc", userId);
			const previousSize = previousVcList?.vc_list.length || 0;
			const vcEntityList = await fetchVcData();
			setVcEntityList(vcEntityList);

			const queryParams = window.location.search;
			const tokenSent = sessionStorage.getItem('tokenSentInSession') === 'false';
			const shouldPoll = (queryParams.includes('code') || queryParams.includes('credential_offer')) && tokenSent;

			const newCredentialsFound = previousSize < vcEntityList.length;
			window.history.replaceState({}, '', `/`);
			if (shouldPoll && !newCredentialsFound) {
				console.log("No new credentials, starting polling");
				pollForCredentials();
			} else if (newCredentialsFound) {
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
		<CredentialsContext.Provider value={{ vcEntityList, latestCredentials, getData }}>
			{children}
		</CredentialsContext.Provider>
	);
};

export default CredentialsContext;
