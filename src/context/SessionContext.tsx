import React, { createContext } from 'react';
import { useApi } from '../api';
import { useLocalStorageKeystore } from '../services/LocalStorageKeystore';

const SessionContext = createContext({
	isLoggedIn: false,
});

export const SessionContextProvider = ({ children }) => {
	const api = useApi();
	const keystore = useLocalStorageKeystore();
	const isLoggedIn = api.isLoggedIn() && keystore.isOpen();

	return (
		<SessionContext.Provider value={{ isLoggedIn }}>
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
