import { useCallback, useEffect, useRef, useState } from 'react';
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
	// True at mount means this reconnect was already pending (a reload), not live.
	const wasReconnectDetectedAtMount = useRef(reconnectDetected === true).current;
	const [latestIsOnlineStatus, setLatestIsOnlineStatus] = useClearOnClearSession(useSessionStorage('latestIsOnlineStatus', null));

	const [showAuthPopup, setShowAuthPopup] = useState(false);
	const [showSyncPopup, setShowSyncPopup] = useState(false);
	const [textSyncPopup, setTextSyncPopup] = useState<{ description: string }>({ description: "" });
	const [showSyncNotification, setShowSyncNotification] = useState(false);

	useEffect(() => {
		if (latestIsOnlineStatus === false && isOnline === true && cachedUser) {
			setReconnectDetected(true);
			setSynced(false);
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
			setShowSyncPopup(false);
			setShowSyncNotification(false);
			return;
		}
		if (reconnectDetected === true && wasReconnectDetectedAtMount) {
			// Reload while pending: show the popup and notification together.
			setShowAuthPopup(true);
			setShowSyncNotification(true);
			setShowSyncPopup(false);
		} else if (reconnectDetected === true) {
			// Fresh reconnect: show the notification first, not the popup.
			setShowSyncNotification(true);
			setShowSyncPopup(false);
		} else {
			// Not a reconnect (e.g. cross-device mismatch): fall back to the original popup.
			setTextSyncPopup({ description: 'syncPopup.description' });
			setShowSyncPopup(true);
			setShowSyncNotification(false);
		}
	}, [location, synced, setSynced, reconnectDetected, wasReconnectDetectedAtMount]);

	const openAuthPopup = useCallback(() => {
		setShowAuthPopup(true);
	}, []);

	const dismissSyncNotification = useCallback(() => {
		setShowSyncNotification(false);
	}, []);

	const closeAuthPopup = useCallback(() => setShowAuthPopup(false), []);
	const closeSyncPopup = useCallback(() => setShowSyncPopup(false), []);

	// True only for a still-unresolved reconnect.
	const pendingResync = isLoggedIn && !!cachedUser && reconnectDetected === true;

	return {
		pendingResync,
		showAuthPopup,
		closeAuthPopup,
		showSyncPopup,
		textSyncPopup,
		closeSyncPopup,
		showSyncNotification,
		openAuthPopup,
		dismissSyncNotification,
	};
}
