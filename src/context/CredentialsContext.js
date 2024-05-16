import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useApi } from '../api';
import { extractCredentialFriendlyName } from '../functions/extractCredentialFriendlyName';

const CredentialsContext = createContext();

export const CredentialsProvider = ({ children }) => {
	const api = useApi();
	const [vcEntityList, setVcEntityList] = useState([]);
	const [latestCredentials, setLatestCredentials] = useState(new Set());

	const getData = useCallback(async () => {
		try {
			const response = await api.get('/storage/vc');
			const fetchedVcList = response.data.vc_list;
			const vcEntityList = await Promise.all(fetchedVcList.map(async vcEntity => {
				const name = await extractCredentialFriendlyName(vcEntity.credential);
				return { ...vcEntity, friendlyName: name };
			}));
			vcEntityList.sort((vcA, vcB) => new Date(vcB.issuanceDate) - new Date(vcA.issuanceDate));

			const latestIssuanceDate = vcEntityList[0]?.issuanceDate;
			const latestCreds = new Set(vcEntityList.filter(vc => vc.issuanceDate === latestIssuanceDate).map(vc => vc.id));

			if (window.location.pathname.includes('/cb')) {
				setLatestCredentials(latestCreds);
				setTimeout(() => {
					setLatestCredentials(new Set());
				}, 8000);  // Clear the highlight after 5 seconds
			}

			setVcEntityList(vcEntityList);
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
