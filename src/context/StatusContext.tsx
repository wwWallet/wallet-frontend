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
	updateOnlineStatus: (forceCheck?: boolean) => Promise<void>;
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
	const lastUpdateCallTime = React.useRef<number>(0);

	const updateOnlineStatus = async (forceCheck = true) => {

		const navigatorOnline = getNavigatorOnlineStatus();
		const now = Date.now();

		// If not a forced check and last call was within the last 5 seconds, skip the update
		if (!forceCheck && now - lastUpdateCallTime.current < 5000) {
			return;
		}

		// Update the last call time
		lastUpdateCallTime.current = now;

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
		// Add event listeners for online/offline status
		window.addEventListener('online', () => updateOnlineStatus());
		window.addEventListener('offline', () => updateOnlineStatus());

		// Cleanup event listeners on unmount
		return () => {
			window.removeEventListener('online', () => updateOnlineStatus());
			window.removeEventListener('offline', () => updateOnlineStatus());
		};
	}, []);

	useEffect(() => {
		console.log('Online status:', isOnline);
		console.log('Internet connection status:', connectivity);
	}, [isOnline, connectivity]);

	// Polling logic when offline
	useEffect(() => {
		let pollingInterval: NodeJS.Timeout | null = null;
		const startPolling = () => {
			pollingInterval = setInterval(async () => {
				updateOnlineStatus();
			}, 7000); // Poll every 7 seconds
		};

		if (!isOnline) {
			startPolling();
		} else if (pollingInterval) {
			clearInterval(pollingInterval);
		}

		return () => {
			if (pollingInterval) {
				clearInterval(pollingInterval);
			}
		};
	}, [isOnline]);

	// Polling logic when online
	useEffect(() => {
		let pollingInterval: NodeJS.Timeout | null = null;

		const startOnlinePolling = () => {
			pollingInterval = setInterval(() => {
				const now = Date.now();

				// Check if it's been more than 20 seconds since the last update call
				if (now - lastUpdateCallTime.current > 20000) {
					updateOnlineStatus(false); // Pass `false` to indicate this is a periodic check
				}
			}, 20000); // Poll every 20 seconds
		};

		if (isOnline) {
			startOnlinePolling();
		} else if (pollingInterval) {
			clearInterval(pollingInterval);
		}

		return () => {
			if (pollingInterval) {
				clearInterval(pollingInterval);
			}
		};
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
		<StatusContext.Provider value={{ isOnline, updateAvailable, connectivity, updateOnlineStatus }}>
			{children}
		</StatusContext.Provider>
	);
};

export default StatusContext;
