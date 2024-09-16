import React, { createContext, useState, useContext, useRef, useCallback } from 'react';
import { extractCredentialFriendlyName } from '../functions/extractCredentialFriendlyName';
import { getItem } from '../indexedDB';
import SessionContext from './SessionContext';
import { compareBy } from '../util';

const CredentialsContext = createContext();

export const CredentialsProvider = ({ children }) => {
	const { api } = useContext(SessionContext);
	const [vcEntityList, setVcEntityList] = useState([]);
	const [latestCredentials, setLatestCredentials] = useState(new Set());
	const intervalId = useRef(null);
	const isPolling = useRef(false);

	const fetchVcData = useCallback(async () => {
		const response = await api.get('/storage/vc');
		const fetchedVcList = response.data.vc_list;

		const vcEntityList = await Promise.all(fetchedVcList.map(async vcEntity => {
			const name = await extractCredentialFriendlyName(vcEntity.credential);
			return { ...vcEntity, friendlyName: name };
		}));

		vcEntityList.sort(compareBy(vc => new Date(vc.issuanceDate)));

		return vcEntityList;
	}, [api]);

	const updateVcListAndLatestCredentials = (vcEntityList) => {
		setLatestCredentials(new Set(vcEntityList.filter(vc => vc.issuanceDate === vcEntityList[0].issuanceDate).map(vc => vc.id)));

		setTimeout(() => {
			setLatestCredentials(new Set());
		}, 2000);

		setVcEntityList(vcEntityList);
	};

	const pollForCredentials = useCallback(() => {
		let attempts = 0;
		isPolling.current = true;

		intervalId.current = setInterval(async () => {
			if (!isPolling.current) {
				isPolling.current = false;
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

			if (attempts >= 5) {
				console.log('Max attempts reached, stopping polling');
				isPolling.current = false;
				clearInterval(intervalId.current);
			}
		}, 1000);
	}, [api, fetchVcData]);

	const getData = useCallback(async () => {
		try {
			const userId = api.getSession().uuid;
			const previousVcList = await getItem("vc", userId);
			const previousSize = previousVcList.vc_list.length;
			const vcEntityList = await fetchVcData();
			setVcEntityList(vcEntityList);

			const shouldPoll = window.location.search.includes('code') && sessionStorage.getItem('tokenSentInSession') === 'false';
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
