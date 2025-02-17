// src/contexts/StatusContext.ts
import { createContext } from 'react';

interface Connectivity {
  navigatorOnline: boolean | null;
  Internet: boolean | null;
  speed: number;
}

interface StatusContextValue {
  isOnline: boolean | null;
  updateAvailable: boolean;
  connectivity: Connectivity;
  updateOnlineStatus: (forceCheck?: boolean) => Promise<void>;
}

const defaultContextValue: StatusContextValue = {
  isOnline: null,
  updateAvailable: false,
  connectivity: { navigatorOnline: null, Internet: null, speed: 0 },
  updateOnlineStatus: async () => {},
};

const StatusContext = createContext<StatusContextValue>(defaultContextValue);

export default StatusContext;
