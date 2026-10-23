import { IBluetoothTransport } from "../../interfaces/IBluetoothTransport";
import { WebBluetoothTransport } from "./WebBluetoothTransport";

/**
 * Create the Bluetooth transport for the current environment: Web Bluetooth
 * if the browser supports it. Returns null if no Bluetooth backend is available.
 */
export function createBluetoothTransport(): IBluetoothTransport | null {
	if (WebBluetoothTransport.isAvailable()) {
		return new WebBluetoothTransport();
	}
	return null;
}

/** Whether any Bluetooth backend is available for proximity sharing. */
export function isBluetoothTransportAvailable(): boolean {
	return WebBluetoothTransport.isAvailable();
}

export type { IBluetoothTransport };
