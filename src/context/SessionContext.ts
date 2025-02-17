import React, { createContext} from 'react';

import { BackendApi } from '../api';
import type { LocalStorageKeystore } from '../services/LocalStorageKeystore';

type SessionContextValue = {
	api: BackendApi,
	isLoggedIn: boolean,
	keystore: LocalStorageKeystore,
	logout: () => Promise<void>,
};

const defaultContextValue: SessionContextValue = {
	api: undefined,
	isLoggedIn: false,
	keystore: undefined,
	logout: async () => { },
};

const SessionContext: React.Context<SessionContextValue> = createContext(defaultContextValue);

export default SessionContext;
