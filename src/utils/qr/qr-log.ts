/**
 * Logging for the environment/capability detection the QR scanner does, so it's
 * possible to tell from the console which engine, camera and APIs were picked.
 */
export function qrLog(scope: string, message: string, details?: unknown): void {
	if (details === undefined) {
		console.log(`[qr:${scope}] ${message}`);
	} else {
		console.log(`[qr:${scope}] ${message}`, details);
	}
}

/**
 * The browsing context facts that decide whether camera access is even allowed.
 * Collected up front, because a rejected getUserMedia never reaches the scanner
 * itself and the reason is usually the context rather than the camera.
 */
export function qrEnvironment(): Record<string, unknown> {
	const inIframe = (() => {
		try {
			return window.self !== window.top;
		} catch (e) {
			return true; // cross-origin frame access threw, so we are definitely framed
		}
	})();

	return {
		userAgent: navigator.userAgent,
		platform: navigator.userAgentData?.platform,
		origin: window.location.origin,
		protocol: window.location.protocol,
		isSecureContext,
		inIframe,
		// iOS home screen web app; undefined in a normal Safari tab and in in-app browsers
		iosStandalone: (navigator as Navigator & { standalone?: boolean }).standalone,
		displayMode: ["standalone", "minimal-ui", "fullscreen", "browser"].find(
			(mode) => window.matchMedia(`(display-mode: ${mode})`).matches,
		),
		hasMediaDevices: !!navigator.mediaDevices,
		hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia,
		hasBarcodeDetector: "BarcodeDetector" in window,
		hasTrustedTypes: "trustedTypes" in window,
		hasOffscreenCanvas: "OffscreenCanvas" in window,
		devicePixelRatio: window.devicePixelRatio,
		screen: { width: window.screen.width, height: window.screen.height },
		viewport: { width: window.innerWidth, height: window.innerHeight },
	};
}
