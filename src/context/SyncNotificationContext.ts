import { createContext } from 'react';

export type SyncNotificationContextValue = {
	pendingResync: boolean,
	showSyncNotification: boolean,
	openAuthPopup: () => void,
	dismissSyncNotification: () => void,
};

const SyncNotificationContext = createContext<SyncNotificationContextValue>({
	pendingResync: false,
	showSyncNotification: false,
	openAuthPopup: () => { },
	dismissSyncNotification: () => { },
});

export default SyncNotificationContext;
