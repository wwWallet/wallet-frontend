import React, { useEffect, createContext, useState } from 'react';


const OnlineStatusContext = createContext();

function getOnlineStatus() {
	const rtt = (
		navigator.connection?.rtt
		// Ignore rtt if browser doesn't support navigator.connection
		?? -Infinity
	);
	return navigator.onLine && rtt < 30000;
}

export const OnlineStatusProvider = ({ children }) => {
	const [isOnline, setIsOnline] = useState(getOnlineStatus);

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

	return (
		<OnlineStatusContext.Provider value={{ isOnline }}>
			{children}
		</OnlineStatusContext.Provider>
	);
};

export default OnlineStatusContext;
