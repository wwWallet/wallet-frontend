import React, { createContext, useState, useCallback, useContext, useRef } from 'react';
import { getItem } from '../indexedDB';
import SessionContext from './SessionContext';
import { compareBy, reverse } from '../util';

const CredentialsContext = createContext();

export const CredentialsProvider = ({ children }) => {
	const { api } = useContext(SessionContext);
	const [vcEntityList, setVcEntityList] = useState([]);
	const [latestCredentials, setLatestCredentials] = useState(new Set());
	const intervalId = useRef(null);
	const isPolling = useRef(false);

	const fetchVcData = async () => {
		const response = await api.get('/storage/vc');
		const fetchedVcList = response.data.vc_list;

		const vcEntityList = await Promise.all(fetchedVcList.map(async vcEntity => {
			return { ...vcEntity };
		}));

		vcEntityList.sort(reverse(compareBy(vc => vc.id)));

		return vcEntityList;
	};

	const updateVcListAndLatestCredentials = (vcEntityList) => {
		setLatestCredentials(new Set(vcEntityList.filter(vc => vc.id === vcEntityList[0].id).map(vc => vc.id)));

		setTimeout(() => {
			setLatestCredentials(new Set());
		}, 2000);

		setVcEntityList(vcEntityList);
	};

	const pollForCredentials = () => {
		let attempts = 0;
		isPolling.current = true;

		intervalId.current = setInterval(async () => {
			const urlParams = new URLSearchParams(window.location.search);
			if (!urlParams.has('code')) {
				console.log('Code parameter no longer exists, stopping polling');
				isPolling.current = false;
				clearInterval(intervalId.current);
				return;
			}

			if (!isPolling.current) {
				clearInterval(intervalId.current);
				return;
			}

			attempts += 1;
			const userId = api.getSession().uuid;
			const previousVcList = await getItem("vc", userId);
			const previousSize = previousVcList.vc_list.length;

			const vcEntityList = await fetchVcData();

			if (previousSize < vcEntityList.length) {
				console.log('Found new credentials, stopping polling');
				isPolling.current = false;
				clearInterval(intervalId.current);
				updateVcListAndLatestCredentials(vcEntityList);
			}

			if (attempts >= 10) {
				console.log('Max attempts reached, stopping polling');
				isPolling.current = false;
				clearInterval(intervalId.current);
			}
		}, 1000);
	};

	const getData = useCallback(async () => {
		try {
			const userId = api.getSession().uuid;
			const previousVcList = await getItem("vc", userId);
			const previousSize = previousVcList.vc_list.length;
			const vcEntityList = await fetchVcData();
			setVcEntityList(vcEntityList);

			const shouldPoll = window.location.search.includes('code') && sessionStorage.getItem('tokenSentInSession') === 'false';
			const newCredentialsFound = previousSize < vcEntityList.length;

			if (shouldPoll && !newCredentialsFound) {
				console.log("No new credentials, starting polling");
				pollForCredentials();
			} else if (newCredentialsFound) {
				console.log("Found new credentials, no need to poll");
				updateVcListAndLatestCredentials(vcEntityList);
			} else {
				setVcEntityList(vcEntityList);
				setLatestCredentials(new Set());
			}
		} catch (error) {
			console.error('Failed to fetch data', error);
		}
	}, [api]);

	return (
		<CredentialsContext.Provider value={{ vcEntityList, latestCredentials, getData }}>
			{children}
		</CredentialsContext.Provider>
	);
};

export default CredentialsContext;
