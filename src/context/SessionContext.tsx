import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';

import StatusContext from './StatusContext';
import { BackendApi, useApi } from '../api';
import { KeystoreEvent, useLocalStorageKeystore } from '../services/LocalStorageKeystore';
import type { LocalStorageKeystore } from '../services/LocalStorageKeystore';
import keystoreEvents from '../services/keystoreEvents';

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
	const keystore = useLocalStorageKeystore(keystoreEvents);

	// Use a ref to hold a stable reference to the clearSession function
	const clearSessionRef = useRef<() => void>();

	// Memoize clearSession using useCallback
	const clearSession = useCallback(async () => {
		sessionStorage.setItem('freshLogin', 'true');
		console.log('Clear Session');
		api.clearSession();
	}, [api]);

	// Update the ref whenever clearSession changes
	useEffect(() => {
		clearSessionRef.current = clearSession;
	}, [clearSession]);

	const logout = async () => {
		console.log('Logout');
		await keystore.close();
	};

	useEffect(() => {
		// Handler function that calls the current clearSession function
		const handleClearSession = () => {
			if (clearSessionRef.current) {
				clearSessionRef.current();
			}
		};

		// Add event listener
		keystoreEvents.addEventListener(KeystoreEvent.CloseTabLocal, handleClearSession);

		// Cleanup event listener to prevent duplicates
		return () => {
			keystoreEvents.removeEventListener(KeystoreEvent.CloseTabLocal, handleClearSession);
		};
	}, []);

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
