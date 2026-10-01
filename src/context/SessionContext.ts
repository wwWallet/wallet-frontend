import { createContext } from 'react';
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

const SessionContext = createContext<SessionContextValue>({
	api: undefined,
	isLoggedIn: false,
	keystore: undefined,
	obliviousKeyConfig: null,
	logout: async () => { },
});

export default SessionContext;
