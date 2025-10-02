// Imperative bridge for firing notifications outside React.
// Works with notify(type, payload).

import type { NotificationType, NotifyPayload } from "./NotificationContext";

type NotifyBridge = (type: NotificationType, payload?: NotifyPayload) => void;

let _notify: NotifyBridge | null = null;

export function setNotify(fn: NotifyBridge) {
	_notify = fn;
}

export function notify(type: NotificationType, payload?: NotifyPayload) {
	if (_notify) {
		_notify(type, payload);
	} else {
		// Optional: buffer or warn if called before provider mounts
		// console.warn("notify() called before NotificationProvider mounted", { type, payload });
	}
}
