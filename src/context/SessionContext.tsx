import React, { createContext } from 'react';
import { useApi } from '../api';
import { useLocalStorageKeystore } from '../services/LocalStorageKeystore';

type SessionContextValue = {
	isLoggedIn: boolean,
	logout: () => Promise<void>,
};

const SessionContext: React.Context<SessionContextValue> = createContext({
	isLoggedIn: false,
	logout: async () => {},
});

export const SessionContextProvider = ({ children }) => {
	const api = useApi();
	const keystore = useLocalStorageKeystore();

	const value: SessionContextValue = {
		isLoggedIn: api.isLoggedIn() && keystore.isOpen(),
		logout: async () => {
			api.clearSession();
			await keystore.close();
		},
	};

	return (
		<SessionContext.Provider value={ value }>
			{children}
		</SessionContext.Provider>
	);
};

export const withSessionContext: <P>(component: React.ComponentType<P>) => React.ComponentType<P> = <P,>(Component: React.ComponentType<P>) =>
	(props: P) => (
		<SessionContextProvider>
			<Component {...props} />
		</SessionContextProvider>
	);

export default SessionContext;
