import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';

import StatusContext from './StatusContext';
import { BackendApi, useApi } from '../api';
import { KeystoreEvent, useLocalStorageKeystore } from '../services/LocalStorageKeystore';
import type { LocalStorageKeystore } from '../services/LocalStorageKeystore';
import { cleanupListeners } from '../util';


type SessionContextValue = {
	api: BackendApi,
	events: EventTarget,
	isLoggedIn: boolean,
	keystore: LocalStorageKeystore,
	logout: () => Promise<void>,
};

const SessionContext: React.Context<SessionContextValue> = createContext({
	api: undefined,
	events: undefined,
	isLoggedIn: false,
	keystore: undefined,
	logout: async () => { },
});

export const SessionContextProvider = ({ children }) => {
	const { isOnline } = useContext(StatusContext);
	const events = useMemo(() => new EventTarget(), []);
	const api = useApi(isOnline, events);
	const keystore = useLocalStorageKeystore(events);

	const logout = useCallback(
		async () => {
			// Clear URL parameters
			sessionStorage.setItem('freshLogin', 'true');
			api.clearSession();
			await keystore.close();
		},
		[api, keystore],
	);

	useEffect(
		() => cleanupListeners(signal => {
			events.addEventListener(KeystoreEvent.Close, logout, { once: true, signal });
			events.addEventListener(KeystoreEvent.CloseTabLocal, api.clearSession, { once: true, signal });
		}),
		[api, events, keystore, logout],
	);

	const value: SessionContextValue = {
		api,
		events,
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
