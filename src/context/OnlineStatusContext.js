import React, { useEffect, createContext, useState } from 'react';

const OnlineStatusContext = createContext();

export const OnlineStatusProvider = ({ children }) => {
	const [isOnline, setIsOnline] = useState(() => navigator.onLine && (navigator.connection?.downlink ?? 0) !== 0);

	const updateOnlineStatus = () => {
		setIsOnline(navigator.onLine && (navigator.connection?.downlink ?? 0) !== 0);
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

	return (
		<OnlineStatusContext.Provider value={{ isOnline }}>
			{children}
		</OnlineStatusContext.Provider>
	);
};

export default OnlineStatusContext;
