import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import StatusContext, { Connectivity, StatusContextValue } from './StatusContext';
import { useLocalStorage } from '@/hooks/useStorage';
import { useAppSettings } from '@/hooks/useAppSettings';

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

export const StatusContextProvider = ({ children }: { children: React.ReactNode }) => {
	const [isOnline, setIsOnline] = useState<boolean | null>(null);
	const [updateAvailable, setUpdateAvailable] = useState(false);
	const [connectivity, setConnectivity] = useState<Connectivity>({
		navigatorOnline: null,
		Internet: null,
		speed: null,
	});
	const [pwaInstallable, setPwaInstallable] = useState(null);
	const [hidePwaPrompt, setHidePwaPrompt] = useLocalStorage<boolean>("hidePwaPrompt", false);
	const appSettings = useAppSettings();

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

	useEffect(() => {
		// beforeinstallprompt is triggered if browser can install pwa
		// it will not trigger if pwa is already installed
		const handleBeforeInstallPrompt = (event) => {
			event.preventDefault();
			setPwaInstallable(event);
		};

		// appinstaled is triggered if pwa was installed
		// we want to remove installation prompts in that case
		const handleAppInstalled = () => {
			setPwaInstallable(null);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		window.addEventListener("appinstalled", handleAppInstalled);

		return () => {
			window.removeEventListener("appinstalled", handleAppInstalled);
			window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		};
	}, []);

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

	const dismissPwaPrompt = () => {
		setHidePwaPrompt(true);
	}

	const value: StatusContextValue = {
		isOnline, updateAvailable, connectivity, updateOnlineStatus, pwaInstallable, dismissPwaPrompt, hidePwaPrompt, appSettings
	};

	return (
		<StatusContext.Provider value={value}>
			{children}
		</StatusContext.Provider>
	);
};
