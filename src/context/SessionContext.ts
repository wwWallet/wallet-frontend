import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';

import { BackendApi } from '../api';
import type { LocalStorageKeystore } from '../services/LocalStorageKeystore';

export type SessionContextValue = {
	api: BackendApi,
	isLoggedIn: boolean,
	keystore: LocalStorageKeystore,
	logout: () => Promise<void>,
};

const SessionContext: React.Context<SessionContextValue> = createContext({
	api: undefined,
	isLoggedIn: false,
	keystore: undefined,
	logout: async () => { },
});

export default SessionContext;
