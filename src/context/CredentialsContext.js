import React, { createContext, useState, useEffect } from 'react';
import { useApi } from '../api';
import { extractCredentialFriendlyName } from '../functions/extractCredentialFriendlyName';

const CredentialsContext = createContext();

export const CredentialsProvider = ({ children }) => {
	const api = useApi();
	const [vcEntityList, setVcEntityList] = useState([]);

	useEffect(() => {
		const getData = async () => {
			const response = await api.get('/storage/vc');
			const vcEntityList = await Promise.all(response.data.vc_list.map(async vcEntity => {
				const name = await extractCredentialFriendlyName(vcEntity.credential);
				return { ...vcEntity, friendlyName: name };
			}));
			vcEntityList.sort((vcA, vcB) => vcB.issuanceDate - vcA.issuanceDate);
			setVcEntityList(vcEntityList);
		};
		getData();
	}, [api]);

	const refreshCredentials = async () => {
		const response = await api.get('/storage/vc');
		const vcEntityList = await Promise.all(response.data.vc_list.map(async vcEntity => {
			const name = await extractCredentialFriendlyName(vcEntity.credential);
			return { ...vcEntity, friendlyName: name };
		}));
		vcEntityList.sort((vcA, vcB) => vcB.issuanceDate - vcA.issuanceDate);
		setVcEntityList(vcEntityList);
	};

	return (
		<CredentialsContext.Provider value={{ vcEntityList, refreshCredentials }}>
			{children}
		</CredentialsContext.Provider>
	);
};

export default CredentialsContext;
