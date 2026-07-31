import React, { createContext } from 'react';

export type SyncNotificationContextValue = {
	pendingResync: boolean,
	showSyncNotification: boolean,
	openAuthPopup: () => void,
	dismissSyncNotification: () => void,
};

const SyncNotificationContext: React.Context<SyncNotificationContextValue> = createContext({
	pendingResync: false,
	showSyncNotification: false,
	openAuthPopup: () => { },
	dismissSyncNotification: () => { },
});

export default SyncNotificationContext;
