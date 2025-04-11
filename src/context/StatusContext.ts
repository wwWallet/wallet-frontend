import { createContext } from 'react';
import { AppSettings } from '@/hooks/useAppSettings';

export interface Connectivity {
	navigatorOnline: boolean | null;
	Internet: boolean | null;
	speed: number | null;
}

export interface StatusContextValue {
	isOnline: boolean;
	updateAvailable: boolean;
	connectivity: Connectivity;
	pwaInstallable: Event;
	dismissPwaPrompt: () => void;
	hidePwaPrompt: boolean;
	updateOnlineStatus: (forceCheck?: boolean) => Promise<void>;
	appSettings: AppSettings;
}

const StatusContext = createContext<StatusContextValue>({
	isOnline: null,
	updateAvailable: false,
	connectivity: { navigatorOnline: null, Internet: null, speed: null },
	pwaInstallable: null,
	dismissPwaPrompt: () => { },
	hidePwaPrompt: false,
	updateOnlineStatus: async () => { },
	appSettings: undefined,
});

export default StatusContext;
