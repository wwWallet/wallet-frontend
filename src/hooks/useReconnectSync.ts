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
 * resulting resync UI: a dismissible notification banner for a fresh,
 * live reconnect, escalating to the auth popup once the user asks to
 * resync (or a reload finds the reconnect still unresolved). Any other
 * cause of a sync failure (e.g. a genuine cross-device mismatch) falls
 * back to the original sync popup instead.
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
	// True if pending before this page load and cleared while offline.
	const wasReconnectDetectedAtMountRef = useRef(reconnectDetected === true);
	const wasReconnectDetectedAtMount = wasReconnectDetectedAtMountRef.current;
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
			setReconnectDetected(false);
			wasReconnectDetectedAtMountRef.current = false;
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
		if (reconnectDetected === true && wasReconnectDetectedAtMount) {
			// Reload while pending: show the popup and notification together.
			setPopupDescriptionKey('authPopup.description');
			setShowSyncNotification(true);
		} else if (reconnectDetected === true) {
			// Fresh reconnect: show the notification first, not the popup.
			setShowSyncNotification(true);
		} else {
			// Not a reconnect (e.g. cross-device mismatch): fall back to the original popup.
			setPopupDescriptionKey('syncPopup.description');
			setShowSyncNotification(false);
		}
	}, [location, synced, setSynced, reconnectDetected, wasReconnectDetectedAtMount, isOnline]);

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
