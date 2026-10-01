import { createContext, useContext } from 'react';
import { BackendApi } from '../api';
import type { LocalStorageKeystore } from '../services/LocalStorageKeystore';
import { HpkeConfig } from '@/lib/utils/ohttpHelpers';

export type SessionContextValue = {
	api: BackendApi,
	isLoggedIn: boolean,
	keystore: LocalStorageKeystore,
	logout: () => Promise<void>,
	obliviousKeyConfig: HpkeConfig | null
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function useSessionContext(): SessionContextValue {
	const value = useContext(SessionContext);
	if (value === undefined) {
		throw new Error('useSessionContext must be used within SessionContextProvider');
	}
	return value;
}

export default SessionContext;
