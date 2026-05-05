import { createContext } from 'react';

export interface Connectivity {
	navigatorOnline: boolean | null;
	Internet: boolean | null;
	speed: number | null;
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
	connectivity: { navigatorOnline: null, Internet: null, speed: null },
	updateOnlineStatus: async () => { },
});

export default StatusContext;
