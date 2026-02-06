import React, { useContext, useEffect, useCallback, useRef, useMemo, useState } from 'react';

import StatusContext from './StatusContext';
import { useApi } from '../api';
import { KeystoreEvent, useLocalStorageKeystore } from '../services/LocalStorageKeystore';
import keystoreEvents from '../services/keystoreEvents';
import SessionContext, { SessionContextValue } from './SessionContext';
import { useLocalStorage, useSessionStorage } from '@/hooks/useStorage';
import { fetchKeyConfig, HpkeConfig } from '@/lib/utils/ohttpHelpers';
import { OHTTP_KEY_CONFIG } from '@/config';

export const SessionContextProvider = ({ children }: React.PropsWithChildren) => {
	const { isOnline } = useContext(StatusContext);
	const api = useApi(isOnline);
	const keystore = useLocalStorageKeystore(keystoreEvents);
	const { getCalculatedWalletState } = keystore;
	const isLoggedIn = useMemo(() => api.isLoggedIn() && keystore.isOpen(), [keystore, api]);

	const [walletStateLoaded, setWalletStateLoaded] = useState<boolean>(false);
	const [obliviousKeyConfig, setObliviousKeyConfig] = useState<HpkeConfig>(null);

	// A unique id for each logged in tab
	const [globalTabId] = useLocalStorage<string | null>("globalTabId", null);
	const [tabId] = useSessionStorage<string | null>("tabId", null);

	const [appToken] = useSessionStorage<string | null>("appToken", null);


	// Use a ref to hold a stable reference to the clearSession function
	const clearSessionRef = useRef<() => void>();

	// Memoize clearSession using useCallback
	const clearSession = useCallback(async () => {
		window.history.replaceState({}, '', `${window.location.pathname}`);
		console.log('[Session Context] Clear Session');
		api.clearSession();
	}, [api]);

	// Update the ref whenever clearSession changes
	useEffect(() => {
		clearSessionRef.current = clearSession;
	}, [clearSession]);

	// The close() will dispatch Event CloseSessionTabLocal in order to call the clearSession
	const logout = useCallback(async () => {
		console.log('[Session Context] Close Keystore');
		await keystore.close();
	}, [keystore]);

	useEffect(() => {
		// Handler function that calls the current clearSession function
		const handleClearSession = () => {
			if (clearSessionRef.current) {
				clearSessionRef.current();
			}
		};

		// Add event listener
		keystoreEvents.addEventListener(KeystoreEvent.CloseSessionTabLocal, handleClearSession);

		// Cleanup event listener to prevent duplicates
		return () => {
			keystoreEvents.removeEventListener(KeystoreEvent.CloseSessionTabLocal, handleClearSession);
		};
	}, []);

	useEffect(() => {
		const S = getCalculatedWalletState();
		if (S) {
			if (S.settings['useOblivious'] === "true") {
				// To use oblivious, keys must be fetched.
				// Delay setWalletStateLoaded till then.
				async function fetchKeyConfigAndUpdate() {
					const keyConfig = await fetchKeyConfig(OHTTP_KEY_CONFIG);
					setObliviousKeyConfig(keyConfig);
					setWalletStateLoaded(true);
				}
				fetchKeyConfigAndUpdate();
			} else {
				setObliviousKeyConfig(null);
				setWalletStateLoaded(true);
			}
		}
	}, [getCalculatedWalletState]);

	const value: SessionContextValue = useMemo(() => ({
		api,
		isLoggedIn: isLoggedIn,
		keystore,
		logout,
		obliviousKeyConfig
	}), [api, keystore, logout, isLoggedIn, obliviousKeyConfig]);

	useEffect(() => {
		if (api && keystore && api.isLoggedIn() === true && keystore.isOpen() === false && ((tabId && globalTabId && tabId !== globalTabId) || (!tabId && globalTabId))) {
			clearSession();
		}
	}, [globalTabId, tabId, clearSession, api, keystore]);

	useEffect(() => {
		if ((appToken === "" && isLoggedIn === true && isOnline === true) || // is logged-in when offline but now user is online again
			(appToken !== "" && appToken !== null && isLoggedIn === true && isOnline === false)) { // is logged-in when online but now the user has lost connection
			logout();
		}

	}, [appToken, isLoggedIn, isOnline, logout])

	if ((api.isLoggedIn() === true && (keystore.isOpen() === false || !walletStateLoaded))) {
		return <></>
	}
	return (
		<SessionContext.Provider value={value}>
			{children}
		</SessionContext.Provider>
	);
};
