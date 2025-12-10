import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import StatusContext, { Connectivity } from './StatusContext';
import { useLocalStorage } from '@/hooks/useStorage';

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

export const StatusContextProvider = ({ children }: React.PropsWithChildren) => {
	const [isOnline, setIsOnline] = useState<boolean | null>(null);
	const [updateAvailable, setUpdateAvailable] = useState(false);
	const [connectivity, setConnectivity] = useState<Connectivity>({
		navigatorOnline: null,
		Internet: null,
		speed: null,
	});
	const [pwaInstallable, setPwaInstallable] = useState(null);
	const [hidePwaPrompt, setHidePwaPrompt] = useLocalStorage<boolean>("hidePwaPrompt", false);

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
	}

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
	}, [isOnline]);

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

		const poll = () => {
			const now = Date.now();
			if (!document.hidden && now - lastUpdateCallTime.current > 20000) {
				updateOnlineStatus(false);
			}
		};

		const startPolling = () => {
			if (!pollingInterval) {
				pollingInterval = setInterval(poll, 20000);
			}
		};

		const stopPolling = () => {
			if (pollingInterval) {
				clearInterval(pollingInterval);
				pollingInterval = null;
			}
		};

		const handleVisibilityChange = () => {
			if (document.hidden) {
				stopPolling();
			} else {
				startPolling();
				poll(); // Trigger immediately when returning to foreground
			}
		};

		if (isOnline) {
			startPolling();
			document.addEventListener('visibilitychange', handleVisibilityChange);
		}

		return () => {
			stopPolling();
			document.removeEventListener('visibilitychange', handleVisibilityChange);
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

	useEffect(() => {
		const handler = (event: MessageEvent) => {
			if (event.data?.type === "NEW_CONTENT_AVAILABLE") {
				if (document.hidden) {
					window.location.reload();
				} else {
					setUpdateAvailable(true);
				}
			}
		};

		if (navigator.serviceWorker) {
			navigator.serviceWorker.addEventListener("message", handler);
		}

		return () => {
			if (navigator.serviceWorker) {
				navigator.serviceWorker.removeEventListener("message", handler);
			}
		};
	}, []);

	const dismissPwaPrompt = () => {
		setHidePwaPrompt(true);
	}

	useEffect(() => {
		updateOnlineStatus();
	}, []);
	return (
		<StatusContext.Provider value={{ isOnline, updateAvailable, connectivity, updateOnlineStatus, pwaInstallable, dismissPwaPrompt, hidePwaPrompt }}>
			{children}
		</StatusContext.Provider>
	);
};
