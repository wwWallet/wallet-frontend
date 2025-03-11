import { createContext } from 'react';

export interface Connectivity {
	navigatorOnline: boolean;
	Internet: boolean;
	speed: number;
}

interface StatusContextValue {
	isOnline: boolean;
	updateAvailable: boolean;
	connectivity: Connectivity;
	pwaInstallable: Event;
	updateOnlineStatus: (forceCheck?: boolean) => Promise<void>;
}

const StatusContext = createContext<StatusContextValue>({
	isOnline: null,
	updateAvailable: false,
	connectivity: { navigatorOnline: null, Internet: null, speed: 0 },
	pwaInstallable: null,
	updateOnlineStatus: async () => { },
});

export default StatusContext;
