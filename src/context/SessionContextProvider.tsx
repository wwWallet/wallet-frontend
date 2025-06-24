import React, { useContext, useEffect, useCallback, useRef, useMemo } from 'react';

import StatusContext from './StatusContext';
import { useApi } from '../api';
import { KeystoreEvent, useLocalStorageKeystore } from '../services/LocalStorageKeystore';
import keystoreEvents from '../services/keystoreEvents';
import SessionContext, { SessionContextValue } from './SessionContext';
import { useWalletStateCredentialsMigrationManager } from '@/services/WalletStateCredentialsMigrationManager';
import { useWalletStatePresentationsMigrationManager } from '@/services/WalletStatePresentationsMigrationManager';
import { useWalletStateSettingsMigrationManager } from '@/services/WalletStateSettingsMigrationManager';

export const SessionContextProvider = ({ children }) => {
	const { isOnline } = useContext(StatusContext);
	const api = useApi(isOnline);
	const keystore = useLocalStorageKeystore(keystoreEvents);
	const _credentialMigrationManager = useWalletStateCredentialsMigrationManager(keystore, api, isOnline, api.isLoggedIn() && keystore.isOpen());
	const _presentationMigrationManager = useWalletStatePresentationsMigrationManager(keystore, api, isOnline, api.isLoggedIn() && keystore.isOpen());
	const _settingslMigrationManager = useWalletStateSettingsMigrationManager(keystore, api, isOnline, api.isLoggedIn() && keystore.isOpen());

	// Use a ref to hold a stable reference to the clearSession function
	const clearSessionRef = useRef<() => void>();

	// Memoize clearSession using useCallback
	const clearSession = useCallback(async () => {
		window.history.replaceState({}, '', `${window.location.pathname}`);
		console.log('Clear Session');
		api.clearSession();
	}, [api]);

	// Update the ref whenever clearSession changes
	useEffect(() => {
		clearSessionRef.current = clearSession;
	}, [clearSession]);

	// The close() will dispatch Event CloseSessionTabLocal in order to call the clearSession
	const logout = async () => {
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
		keystoreEvents.addEventListener(KeystoreEvent.CloseSessionTabLocal, handleClearSession);

		// Cleanup event listener to prevent duplicates
		return () => {
			keystoreEvents.removeEventListener(KeystoreEvent.CloseSessionTabLocal, handleClearSession);
		};
	}, []);

	const value: SessionContextValue = useMemo(() => ({
		api,
		isLoggedIn: api.isLoggedIn() && keystore.isOpen(),
		keystore,
		logout,
	}), [api, keystore, logout]);

	return (
		<SessionContext.Provider value={value}>
			{children}
		</SessionContext.Provider>
	);
};
