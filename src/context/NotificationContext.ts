import { createContext, useContext } from "react";

export type NotificationType = "success" | "newCredential";

export type NotifyPayload = {
	title?: string;
	message?: string;
	duration?: number;
};

export type NotifyFn = (type: NotificationType, payload?: NotifyPayload) => string;

export type NotificationAPI = {
	notify: NotifyFn;   // single entry point
	remove: (id: string) => void;
};

const NotificationContext = createContext<NotificationAPI | null>(null);

export default NotificationContext;
