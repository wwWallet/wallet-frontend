import React, { useEffect, createContext, useState } from 'react';
import { useLocalStorageKeystore } from '../services/LocalStorageKeystore';
import { useApi } from '../api';
/**
 * Type polyfill for https://wicg.github.io/netinfo/#networkinformation-interface
 * but defining only the properties we use here.
 */
interface NetworkInformation extends EventTarget {
	rtt: Millisecond,
}
type Millisecond = number;

declare global {
	export interface Navigator {
		connection?: NetworkInformation;
	}
}

interface OnlineStatusContextValue {
	isOnline: boolean;
	updateAvailable: boolean;
}


const OnlineStatusContext: React.Context<OnlineStatusContextValue> = createContext({
	isOnline: null,
	updateAvailable: false,
});

function getOnlineStatus(): boolean {
	const rtt = (
		navigator.connection?.rtt
		// Ignore rtt if browser doesn't support navigator.connection
		?? Infinity
	);
	return navigator.onLine && rtt > 0;
}

export const OnlineStatusProvider = ({ children }: { children: React.ReactNode }) => {
	const [isOnline, setIsOnline] = useState(getOnlineStatus);
	const [updateAvailable, setUpdateAvailable] = useState(false);
	const api = useApi(isOnline);
	const keystore = useLocalStorageKeystore();
	const updateOnlineStatus = () => {
		setIsOnline(getOnlineStatus());
	};

	useEffect(() => {
		window.addEventListener('online', updateOnlineStatus);
		window.addEventListener('offline', updateOnlineStatus);
		navigator.connection?.addEventListener('change', updateOnlineStatus);

		return () => {
			window.removeEventListener('online', updateOnlineStatus);
			window.removeEventListener('offline', updateOnlineStatus);
			navigator.connection?.removeEventListener('change', updateOnlineStatus);
		};
	}, []);

	useEffect(() => {
		console.log("Online status changed to ", isOnline);
	}, [isOnline]);

	navigator.serviceWorker.addEventListener('message', (event) => {
		if (event.data && event.data.type === 'NEW_CONTENT_AVAILABLE') {

			const isLoggedIn = api.isLoggedIn() && keystore.isOpen();

			if (!isLoggedIn) {
				window.location.reload();
			} else {
				setUpdateAvailable(true);
			}
		}
	});

	return (
		<OnlineStatusContext.Provider value={{ isOnline, updateAvailable }}>
			{children}
		</OnlineStatusContext.Provider>
	);
};

export default OnlineStatusContext;
