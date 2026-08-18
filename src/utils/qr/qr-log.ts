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
