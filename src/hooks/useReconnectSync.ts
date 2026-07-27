import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { BackendApi } from '@/api';
import type { CachedUser, LocalStorageKeystore } from '@/services/LocalStorageKeystore';
import { useSessionStorage } from '@/hooks/useStorage';

type UseReconnectSyncArgs = {
	isOnline: boolean,
	isLoggedIn: boolean,
	cachedUser: CachedUser | null,
	synced: boolean,
	setSynced: (synced: boolean) => void,
	getCalculatedWalletState: LocalStorageKeystore['getCalculatedWalletState'],
	syncPrivateData: BackendApi['syncPrivateData'],
	useClearOnClearSession: BackendApi['useClearOnClearSession'],
};

/**
 * Detects an offline->online reconnect while logged in and drives the
 * resulting resync UI: a notification banner that opens the auth popup
 * once the user asks to resync. Reloading with an unresolved resync opens
 * the popup immediately. Any other cause of a sync failure (e.g. a
 * cross-device mismatch) falls back to the original sync popup.
 */
export function useReconnectSync({
	isOnline,
	isLoggedIn,
	cachedUser,
	synced,
	setSynced,
	getCalculatedWalletState,
	syncPrivateData,
	useClearOnClearSession,
}: UseReconnectSyncArgs) {
	const location = useLocation();

	// Persisted so a reload while unresolved still reads as "pending", not fresh.
	const [reconnectDetected, setReconnectDetected] = useClearOnClearSession(useSessionStorage('reconnectDetected', null));
	const reconnectWasPendingAtMount = useRef(reconnectDetected === true).current;
	// Once this page instance observes offline status, a later reconnect is fresh,
	// even if an unresolved reconnect was persisted when the page first loaded.
	const wentOfflineSinceMountRef = useRef(isOnline === false);
	const [latestIsOnlineStatus, setLatestIsOnlineStatus] = useClearOnClearSession(useSessionStorage('latestIsOnlineStatus', null));

	// Which popup to show, if any -- both render the same component, they only
	// differ in this i18n key.
	const [popupDescriptionKey, setPopupDescriptionKey] = useState<string | null>(null);
	const [showSyncNotification, setShowSyncNotification] = useState(false);

	useLayoutEffect(() => {
		if (latestIsOnlineStatus === false && isOnline === true && cachedUser) {
			setReconnectDetected(true);
			setSynced(false);
		} else if (isOnline === false) {
			wentOfflineSinceMountRef.current = true;
			setReconnectDetected(false);
		}
		setLatestIsOnlineStatus(isLoggedIn ? isOnline : null);
	}, [isLoggedIn, isOnline, latestIsOnlineStatus, setLatestIsOnlineStatus, cachedUser, setSynced, setReconnectDetected]);

	useEffect(() => {
		if (!getCalculatedWalletState || !cachedUser || !syncPrivateData) {
			return;
		}
		const params = new URLSearchParams(location.search);
		// syncPrivateData no-ops offline, which would wrongly mark this synced.
		if (isOnline && synced === false && getCalculatedWalletState() && params.get('sync') !== 'fail') {
			console.log("Actually syncing...");
			syncPrivateData(cachedUser).then((r) => {
				if (!r.ok) {
					return;
				}
				setSynced(true);
				// Clear so a later, unrelated failure isn't misread as this reconnect.
				setReconnectDetected(false);
			});
		}
	}, [cachedUser, synced, setSynced, getCalculatedWalletState, syncPrivateData, location.search, isOnline, setReconnectDetected]);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		if (synced === true && params.get('sync') === 'fail') {
			setSynced(false);
			return;
		}
		if (params.get('sync') !== 'fail' || synced !== false) {
			setPopupDescriptionKey(null);
			setShowSyncNotification(false);
			return;
		}
		if (!isOnline) {
			setPopupDescriptionKey(null);
			setShowSyncNotification(false);
			return;
		}
		if (reconnectDetected === true && reconnectWasPendingAtMount && !wentOfflineSinceMountRef.current) {
			// A reload while resync is unresolved opens the popup.
			setPopupDescriptionKey('authPopup.description');
			setShowSyncNotification(true);
		} else if (reconnectDetected === true) {
			// Reconnects observed within this page session show the banner first.
			setPopupDescriptionKey(null);
			setShowSyncNotification(true);
		} else {
			// Not a reconnect (e.g. cross-device mismatch): fall back to the original popup.
			setPopupDescriptionKey('syncPopup.description');
			setShowSyncNotification(false);
		}
	}, [location, synced, setSynced, reconnectDetected, reconnectWasPendingAtMount, isOnline]);

	const openAuthPopup = useCallback(() => {
		setPopupDescriptionKey('authPopup.description');
	}, []);

	const dismissSyncNotification = useCallback(() => {
		setShowSyncNotification(false);
	}, []);

	const closeAuthPopup = useCallback(() => setPopupDescriptionKey(null), []);

	// True only for a still-unresolved reconnect.
	const pendingResync = isLoggedIn && !!cachedUser && reconnectDetected === true;

	return {
		pendingResync,
		popupDescriptionKey,
		closeAuthPopup,
		showSyncNotification,
		openAuthPopup,
		dismissSyncNotification,
	};
}
