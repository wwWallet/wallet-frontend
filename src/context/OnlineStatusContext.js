import React, { useEffect, createContext, useState } from 'react';

const OnlineStatusContext = createContext();

const getConnectivityQuality = (downlink) => {
	if (downlink >= 10) return 5;
	if (downlink >= 5) return 4;
	if (downlink >= 2) return 3;
	if (downlink >= 0.5) return 2;
	return 1;
};

const getConnectivityValues = () => {
	console.log('navigator', navigator.connection);
	if (navigator.connection) {
		const { downlink } = navigator.connection;
		return { downlink };
	}
	return { downlink: 0 };
};

export const OnlineStatusProvider = ({ children }) => {
	const [isOnline, setIsOnline] = useState(() => navigator.onLine && navigator.connection?.type !== "unknown");
	const [connectivityQuality, setConnectivityQuality] = useState(1);

	const updateOnlineStatus = () => {
		setIsOnline(navigator.onLine && navigator.connection?.type !== "unknown");
		const quality = getConnectivityQuality(getConnectivityValues().downlink);
		setConnectivityQuality(quality);
	};

	useEffect(() => {
		window.addEventListener('online', updateOnlineStatus);
		window.addEventListener('offline', updateOnlineStatus);
		navigator.connection?.addEventListener('change', updateOnlineStatus);

		// Initial update
		updateOnlineStatus();

		return () => {
			window.removeEventListener('online', updateOnlineStatus);
			window.removeEventListener('offline', updateOnlineStatus);
			navigator.connection?.removeEventListener('change', updateOnlineStatus);
		};
	}, []);

	useEffect(() => {
		console.log("Online status changed to ", isOnline);
	}, [isOnline]);

	useEffect(() => {
		console.log("Connectivity status change to ", connectivityQuality);
	}, [connectivityQuality]);

	return (
		<OnlineStatusContext.Provider value={{ isOnline, connectivityQuality }}>
			{children}
		</OnlineStatusContext.Provider>
	);
};

export default OnlineStatusContext;
