import React, { createContext } from 'react';
import { useApi } from '../api';
import { useLocalStorageKeystore } from '../services/LocalStorageKeystore';
import type { LocalStorageKeystore } from '../services/LocalStorageKeystore';


type SessionContextValue = {
	isLoggedIn: boolean,
	keystore: LocalStorageKeystore,
	logout: () => Promise<void>,
};

const SessionContext: React.Context<SessionContextValue> = createContext({
	isLoggedIn: false,
	keystore: undefined,
	logout: async () => {},
});

export const SessionContextProvider = ({ children }) => {
	const api = useApi();
	const keystore = useLocalStorageKeystore();

	const value: SessionContextValue = {
		isLoggedIn: api.isLoggedIn() && keystore.isOpen(),
		keystore,
		logout: async () => {

			// Clear URL parameters
			window.history.replaceState(null, '', '/');

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
