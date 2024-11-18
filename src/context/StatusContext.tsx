import React, { useEffect, createContext, useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config';

interface Connectivity {
	navigatorOnline: boolean;
	Internet: boolean;
	speed: number;
}

interface StatusContextValue {
	isOnline: boolean;
	updateAvailable: boolean;
	connectivity: Connectivity;
	updateOnlineStatus: () => Promise<void>;
}

const StatusContext = createContext<StatusContextValue>({
	isOnline: null,
	updateAvailable: false,
	connectivity: { navigatorOnline: null, Internet: null, speed: 0 },
	updateOnlineStatus: async () => { },
});

// Function to calculate speed based on RTT (lower RTT means higher speed)
function calculateNetworkSpeed(rtt: number): number {
	if (rtt < 100) return 5; // Excellent speed
	if (rtt < 200) return 4; // Good speed
	if (rtt < 500) return 3; // Moderate speed
	if (rtt < 1000) return 2; // Slow speed
	return 1; // Very slow speed
}

async function checkInternetConnection(): Promise<{ isConnected: boolean; speed: number }> {
	try {
		const startTime = new Date().getTime();
		await axios.get(`${BACKEND_URL}/status`, {
			timeout: 5000, // Timeout of 5 seconds
			headers: {
				'Content-Type': 'application/json',
			},
		});
		const endTime = new Date().getTime();
		const rtt = endTime - startTime; // Calculate RTT

		const speed = calculateNetworkSpeed(rtt);
		console.log('Internet:', true, '- Speed:', speed);
		return { isConnected: true, speed };
	} catch (error) {
		return { isConnected: false, speed: 0 };
	}
}

function getNavigatorOnlineStatus(): boolean {
	return navigator.onLine;
}

export const StatusProvider = ({ children }: { children: React.ReactNode }) => {
	const [isOnline, setIsOnline] = useState<boolean | null>(null);
	const [updateAvailable, setUpdateAvailable] = useState(false);
	const [connectivity, setConnectivity] = useState<Connectivity>({
		navigatorOnline: null,
		Internet: null,
		speed: 0,
	});

	const updateOnlineStatus = async () => {

		const navigatorOnline = getNavigatorOnlineStatus();
		const internetConnection = await checkInternetConnection();

		setConnectivity((prev) => {
			if (
				prev.navigatorOnline === navigatorOnline &&
				prev.Internet === internetConnection.isConnected &&
				prev.speed === internetConnection.speed
			) {
				return prev; // No changes, return previous state to prevent rerender
			}
			return {
				...prev,
				navigatorOnline,
				Internet: internetConnection.isConnected,
				speed: internetConnection.speed,
			};
		});

		setIsOnline((prev) => {
			if (prev === internetConnection.isConnected) {
				return prev; // No change in `isOnline`
			}
			return internetConnection.isConnected;
		});
	};

	useEffect(() => {
		window.addEventListener('online', updateOnlineStatus);
		window.addEventListener('offline', updateOnlineStatus);

		// Initial check for online and backend connection status
		updateOnlineStatus();

		return () => {
			window.removeEventListener('online', updateOnlineStatus);
			window.removeEventListener('offline', updateOnlineStatus);
		};
	}, []);

	useEffect(() => {
		console.log('Online status:', isOnline);
		console.log('Internet connection status:', connectivity);
	}, [isOnline, connectivity]);

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
		<StatusContext.Provider value={{ isOnline, updateAvailable, connectivity, updateOnlineStatus }}>
			{children}
		</StatusContext.Provider>
	);
};

export default StatusContext;
