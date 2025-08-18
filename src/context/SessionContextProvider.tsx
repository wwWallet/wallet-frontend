import React, { useContext, useEffect, useCallback, useRef, useMemo } from 'react';

import StatusContext from './StatusContext';
import { useApi } from '../api';
import { KeystoreEvent, useLocalStorageKeystore } from '../services/LocalStorageKeystore';
import keystoreEvents from '../services/keystoreEvents';
import SessionContext, { SessionContextValue } from './SessionContext';
import { useWalletStateCredentialsMigrationManager } from '@/services/WalletStateCredentialsMigrationManager';
import { useWalletStatePresentationsMigrationManager } from '@/services/WalletStatePresentationsMigrationManager';
import { useWalletStateSettingsMigrationManager } from '@/services/WalletStateSettingsMigrationManager';
import { useLocalStorage, useSessionStorage } from '@/hooks/useStorage';

export const SessionContextProvider = ({ children }) => {
	const { isOnline } = useContext(StatusContext);
	const api = useApi(isOnline);
	const keystore = useLocalStorageKeystore(keystoreEvents);
	const isLoggedIn = useMemo(() => api.isLoggedIn() && keystore.isOpen(), [keystore, api]);

	// A unique id for each logged in tab
	const [globalTabId, setGlobalTabId, clearGlobalTabId] = useLocalStorage<string | null>("globalTabId", null);
	const [tabId, setTabId, clearTabId] = useSessionStorage<string | null>("tabId", null);

	const _credentialMigrationManager = useWalletStateCredentialsMigrationManager(keystore, api, isOnline, isLoggedIn);
	const _presentationMigrationManager = useWalletStatePresentationsMigrationManager(keystore, api, isOnline, isLoggedIn);
	const _settingslMigrationManager = useWalletStateSettingsMigrationManager(keystore, api, isOnline, isLoggedIn);

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

	const value: SessionContextValue = useMemo(() => ({
		api,
		isLoggedIn: isLoggedIn,
		keystore,
		logout,
	}), [api, keystore, logout, isLoggedIn]);

	useEffect(() => {
		if (api && keystore && api.isLoggedIn() === true && keystore.isOpen() === false && ((tabId && globalTabId && tabId !== globalTabId) || (!tabId && globalTabId))) {
			clearSession();
		}
	}, [globalTabId, tabId, clearSession, api, keystore]);


	if (api.isLoggedIn() === true && keystore.isOpen() === false) {
		return <></>
	}
	return (
		<SessionContext.Provider value={value}>
			{children}
		</SessionContext.Provider>
	);
};
