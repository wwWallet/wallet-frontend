import React, { useEffect, createContext, useState } from 'react';

interface StatusContextValue {
	isOnline: boolean;
	updateAvailable: boolean;
	isStandAlone: boolean;
}


const StatusContext: React.Context<StatusContextValue> = createContext({
	isOnline: null,
	updateAvailable: false,
	isStandAlone: false,
});

function getOnlineStatus(): boolean {
	return navigator.onLine;
}

export const StatusProvider = ({ children }: { children: React.ReactNode }) => {
	const [isOnline, setIsOnline] = useState(getOnlineStatus);
	const [isStandAlone] = useState(!process.env.REACT_APP_WALLET_BACKEND_URL || !process.env.REACT_APP_WS_URL);
	const [updateAvailable, setUpdateAvailable] = useState(false);
	const updateOnlineStatus = () => {
		setIsOnline(getOnlineStatus());
	};

	useEffect(() => {
		window.addEventListener('online', updateOnlineStatus);
		window.addEventListener('offline', updateOnlineStatus);

		return () => {
			window.removeEventListener('online', updateOnlineStatus);
			window.removeEventListener('offline', updateOnlineStatus);
		};
	}, []);

	useEffect(() => {
		console.log("Online status changed to:", isOnline);
	}, [isOnline]);

	navigator.serviceWorker.addEventListener('message', (event) => {
		if (event.data && event.data.type === 'NEW_CONTENT_AVAILABLE') {
			const isWindowHidden = document.hidden;

			if (isWindowHidden) {
				window.location.reload();
			} else {
				setUpdateAvailable(true);
			}
		}
	});

	return (
		<StatusContext.Provider value={{ isOnline, updateAvailable, isStandAlone }}>
			{children}
		</StatusContext.Provider>
	);
};

export default StatusContext;
