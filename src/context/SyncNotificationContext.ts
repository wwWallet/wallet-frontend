import React, { createContext } from 'react';

export type SyncNotificationContextValue = {
	showSyncNotification: boolean,
	openAuthPopup: () => void,
	dismissSyncNotification: () => void,
};

const SyncNotificationContext: React.Context<SyncNotificationContextValue> = createContext({
	showSyncNotification: false,
	openAuthPopup: () => { },
	dismissSyncNotification: () => { },
});

export default SyncNotificationContext;
