// Detection of the Android TWA host via the Chrome Custom Tabs postMessage channel.
//
// The channel is opened by the app. The page listens for a message and gets
// the port. The port then can be used to send back to the app.
// This requires localhost or https and assetlinks.json.
// Detection is positive only and involves a handshake with the app.
//
// Current implementation is limited by a bug in Chrome / android-browser-helper
// Track: https://github.com/GoogleChrome/android-browser-helper/issues/602
// The short version is that the port does not survive navigations or refreshes

let currentPort: MessagePort | null = null;
let confirmed = false;
let listenerInstalled = false;
let pingSeq = 0;

const startedAt = Date.now();
const confirmListeners = new Set<(port: MessagePort) => void>();
const probedPorts = new WeakSet<MessagePort>();

export function getTwaPort(): MessagePort | null {
	return currentPort;
}

export function isTwaConfirmed(): boolean {
	return confirmed;
}

export function onTwaConfirmed(listener: (port: MessagePort) => void): () => void {
	confirmListeners.add(listener);
	if (confirmed && currentPort) { listener(currentPort); }
	return () => confirmListeners.delete(listener);
}

function hints() {
	return {
		referrer: document.referrer,
		standalone: window.matchMedia?.('(display-mode: standalone)').matches ?? false,
	};
}

/** Promotes a port that has answered its handshake, retiring any predecessor. */
function adopt(port: MessagePort): void {
	if (port === currentPort) { return; }

	const previous = currentPort;
	currentPort = port;
	confirmed = true;

	if (previous) {
		previous.onmessage = null;
		try {
			previous.close();
		} catch {
			// A port whose document or app side is already gone throws here; the
			// replacement is live either way, so there is nothing to recover from.
		}
	}

	console.log(previous
		? `TWA channel re-established (${Date.now() - startedAt}ms)`
		: `Running inside Android TWA (handshake in ${Date.now() - startedAt}ms)`,
		hints());

	for (const listener of confirmListeners) { listener(port); }
}

/** Handshakes on a newly granted port. Adoption happens only if it answers. */
function probe(port: MessagePort): void {
	if (probedPorts.has(port)) { return; }
	probedPorts.add(port);

	const id = ++pingSeq;

	port.onmessage = (e: MessageEvent) => {
		let message;
		try {
			message = JSON.parse(e.data);
		} catch {
			return;
		}
		// 'ready' arrives unprompted as soon as the channel opens; 'pong' echoes
		// the id of the ping below, so a stale reply cannot confirm a new port.
		if (message?.type === 'ready' || (message?.type === 'pong' && message?.id === id)) {
			adopt(port);
		}
	};
	port.start?.();
	port.postMessage(JSON.stringify({ type: 'ping', id }));
}

function onWindowMessage(event: MessageEvent): void {
	const port = event.ports && event.ports[0];
	if (!port) { return; }

	console.log('TWA port granted, awaiting ready/pong');
	probe(port);
}

/** Installs the window listener */
export function startTwaDetection(): void {
	if (listenerInstalled || typeof window === 'undefined') { return; }
	listenerInstalled = true;
	window.addEventListener('message', onWindowMessage);
}
