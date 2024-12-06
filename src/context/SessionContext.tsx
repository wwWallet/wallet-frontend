import React, { createContext, useContext } from 'react';

import StatusContext from './StatusContext';
import { BackendApi, useApi } from '../api';
import { KeystoreEvent, useLocalStorageKeystore } from '../services/LocalStorageKeystore';
import type { LocalStorageKeystore } from '../services/LocalStorageKeystore';


type SessionContextValue = {
	api: BackendApi,
	isLoggedIn: boolean,
	keystore: LocalStorageKeystore,
	logout: () => Promise<void>,
};

const SessionContext: React.Context<SessionContextValue> = createContext({
	api: undefined,
	isLoggedIn: false,
	keystore: undefined,
	logout: async () => { },
});

export const SessionContextProvider = ({ children }) => {
	const { isOnline } = useContext(StatusContext);
	const api = useApi(isOnline);
	const keystoreEvents = new EventTarget();
	const keystore = useLocalStorageKeystore(keystoreEvents);

	const logout = async () => {
		// Clear URL parameters
		sessionStorage.setItem('freshLogin', 'true');
		api.clearSession();
		await keystore.close();
	};

	keystoreEvents.addEventListener(KeystoreEvent.Close, logout, { once: true });
	keystoreEvents.addEventListener(KeystoreEvent.CloseTabLocal, api.clearSession, { once: true });

	const value: SessionContextValue = {
		api,
		isLoggedIn: api.isLoggedIn() && keystore.isOpen(),
		keystore,
		logout,
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
