import React, { useEffect, createContext, useState } from 'react';
import axios from 'axios';

interface Connectivity {
	navigatorOnline: boolean;
	Internet: boolean;
	speed: number; // Value from 0 to 5
}

interface StatusContextValue {
	isOnline: boolean;
	updateAvailable: boolean;
	Connectivity: Connectivity;
}

const StatusContext: React.Context<StatusContextValue> = createContext({
	isOnline: null,
	updateAvailable: false,
	Connectivity: { navigatorOnline: null, Internet: null, speed: 0 },
});

async function checkInternetConnection(): Promise<boolean> {
	try {
		// const response = await axios.get('http://wallet-backend-server:8002/status', {
		const response = await axios.get('https://www.cloudflare.com/cdn-cgi/trace', {
			timeout: 5000, // Timeout of 5 seconds
			headers: {
				'Content-Type': 'application/json',
			},
		});
		return response.status === 200; // Backend is reachable
	} catch (error) {
		if (error.code === 'ECONNABORTED') {
			console.error('Backend connection timed out');
		} else {
			console.error('Error checking backend connection:', error);
		}
		return false; // Backend is unreachable
	}
}

function getNavigatorOnlineStatus(): boolean {
	return navigator.onLine;
}

// Placeholder function for calculating speed (0 to 5)
function getNetworkSpeed(): number {
	// For now, just simulate a network speed. In real-world, this could be determined based on network latency, request times, etc.
	return Math.floor(Math.random() * 6); // Random speed between 0 and 5
}

export const StatusProvider = ({ children }: { children: React.ReactNode }) => {
	const [isOnline, setIsOnline] = useState<boolean | null>(null);
	const [updateAvailable, setUpdateAvailable] = useState(false);
	const [Connectivity, setConnectivity] = useState<Connectivity>({
		navigatorOnline: null,
		Internet: null,
		speed: 0,
	});

	const updateOnlineStatus = async ({ internetConnection = null }: { internetConnection?: boolean | null } = {}) => {
		const navigatorOnline = getNavigatorOnlineStatus();
		const speed = getNetworkSpeed();
		if (navigatorOnline) {
			// Only check backend connection if navigator is online
			if (internetConnection === null) {
				internetConnection = await checkInternetConnection();
			}
			setConnectivity({
				navigatorOnline: navigatorOnline,
				Internet: internetConnection,
				speed,
			});
			setIsOnline(internetConnection);
		} else {
			// If navigator is offline, set both states
			setConnectivity({
				navigatorOnline: false,
				Internet: false,
				speed: 0,
			});
			setIsOnline(false);
		}
	};

	useEffect(() => {
		// Axios interceptor for handling network errors
		const responseInterceptor = axios.interceptors.response.use(
			(response) => {
				// Return the response if successful
				return response;
			},
			async (error) => {
				console.log('axios error');
				// If the error is due to a network issue, update the online status
				if (error.code === 'ECONNABORTED' || !error.response) {
					setIsOnline(false);
					setConnectivity((prev) => ({
						...prev,
						Internet: false,
					}));
				}
				return Promise.reject(error);
			}
		);

		// Add event listeners for online/offline status
		window.addEventListener('online', () => updateOnlineStatus());
		window.addEventListener('offline', () => updateOnlineStatus());

		// Initial check for online and backend connection status
		updateOnlineStatus();

		// Cleanup function to remove listeners and interceptors
		return () => {
			axios.interceptors.response.eject(responseInterceptor);
			window.removeEventListener('online', () => updateOnlineStatus());
			window.removeEventListener('offline', () => updateOnlineStatus());
		};
	}, []);

	useEffect(() => {
		console.log('Online status:', isOnline);
		console.log('Internet connection status:', Connectivity);
	}, [isOnline, Connectivity]);

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
		<StatusContext.Provider value={{ isOnline, updateAvailable, Connectivity }}>
			{children}
		</StatusContext.Provider>
	);
};

export default StatusContext;
