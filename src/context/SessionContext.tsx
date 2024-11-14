import React, { createContext, useContext } from 'react';

import StatusContext from './StatusContext';
import { BackendApi, useApi } from '../api';
import { useLocalStorageKeystore } from '../services/LocalStorageKeystore';
import type { LocalStorageKeystore } from '../services/LocalStorageKeystore';


type SessionContextValue = {
	api: BackendApi,
	isLoggedIn: boolean,
	isStandAlone: boolean,
	keystore: LocalStorageKeystore,
	logout: () => Promise<void>,
};

const SessionContext: React.Context<SessionContextValue> = createContext({
	api: undefined,
	isLoggedIn: false,
	isStandAlone: false,
	keystore: undefined,
	logout: async () => { },
});

export const SessionContextProvider = ({ children }) => {
	const { isOnline, isStandAlone } = useContext(StatusContext);
	const api = useApi(isOnline, isStandAlone);
	const keystore = useLocalStorageKeystore();

	const value: SessionContextValue = {
		api,
		isLoggedIn: api.isLoggedIn() && (isStandAlone || keystore.isOpen()),
		isStandAlone,
		keystore,
		logout: async () => {

			// Clear URL parameters
			sessionStorage.setItem('freshLogin', 'true');
			api.clearSession();
			await keystore.close();

		},
	};

	return (
		<SessionContext.Provider value={value}>
			{children}
		</SessionContext.Provider>
	);
};

export const withSessionContext: <P>(component: React.ComponentType<P>) => React.ComponentType<P> = (Component) =>
	(props) => (
		<SessionContextProvider>
			<Component {...props} />
		</SessionContextProvider>
	);

export default SessionContext;
