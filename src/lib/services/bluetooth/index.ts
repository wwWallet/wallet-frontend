import { IBluetoothTransport } from "../../interfaces/IBluetoothTransport";
import { NativeBluetoothTransport } from "./NativeBluetoothTransport";
import { WebBluetoothTransport } from "./WebBluetoothTransport";

/**
 * Create the Bluetooth transport for the current environment: the native
 * wrapper (Android app) if present, otherwise Web Bluetooth if the browser
 * supports it. Returns null if no Bluetooth backend is available.
 */
export function createBluetoothTransport(): IBluetoothTransport | null {
	if (NativeBluetoothTransport.isAvailable()) {
		return new NativeBluetoothTransport();
	}
	if (WebBluetoothTransport.isAvailable()) {
		return new WebBluetoothTransport();
	}
	return null;
}

/** Whether any Bluetooth backend is available for proximity sharing. */
export function isBluetoothTransportAvailable(): boolean {
	return NativeBluetoothTransport.isAvailable() || WebBluetoothTransport.isAvailable();
}

/**
 * Whether connect() will open a browser device-chooser dialog (e.g Chrome) and must
 * therefore be triggered by a user gesture, only after the verifier has
 * scanned the QR and started advertising (Web Bluetooth). The native
 * wrapper scans in the background without any UI, so it can connect
 * immediately.
 */
export function bluetoothConnectRequiresUserGesture(): boolean {
	return !NativeBluetoothTransport.isAvailable() && WebBluetoothTransport.isAvailable();
}

export type { IBluetoothTransport };
