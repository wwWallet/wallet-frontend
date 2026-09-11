import { BluetoothConnectionResult, IBluetoothTransport } from "../../interfaces/IBluetoothTransport";

/**
 * Bluetooth transport backed by the native wrapper (Android app) injected
 * as window.nativeWrapper. Chunks are exchanged with the wrapper as
 * JSON-encoded byte arrays whose first element is the ISO 18013-5 framing
 * byte (1 = more chunks follow, 0 = final chunk)
 */
export class NativeBluetoothTransport implements IBluetoothTransport {
	private readonly chunkSize = 512;

	static isAvailable(): boolean {
		return typeof window !== "undefined" && !!window.nativeWrapper?.bluetoothCreateClient;
	}

	async connect(serviceUuid: string, onDeviceSelected?: () => void): Promise<BluetoothConnectionResult> {
		// The native wrapper picks the device itself, no selection to wait for
		onDeviceSelected?.();
		await window.nativeWrapper.bluetoothTerminate(); // Terminate any pending ble connections
		try {
			return await window.nativeWrapper.bluetoothCreateClient(serviceUuid) ? "connected" : "failed";
		} catch (e) {
			console.log(e);
			console.log(await window.nativeWrapper.bluetoothStatus());
			console.log("Could not initialize BLE client");
			return "failed";
		}
	}

	async receiveMessage(): Promise<Uint8Array> {
		let aggregatedData: number[] = [];
		let dataReceived = [1];
		while (dataReceived[0] === 1) {
			dataReceived = JSON.parse(await window.nativeWrapper.bluetoothReceiveFromServer());
			aggregatedData = [...aggregatedData, ...dataReceived.slice(1)];
		}
		return new Uint8Array(aggregatedData);
	}

	async sendMessage(payload: Uint8Array): Promise<void> {
		let toSendBytes = Array.from(payload);
		while (toSendBytes.length > (this.chunkSize - 1)) {
			const chunk = [1, ...toSendBytes.slice(0, (this.chunkSize - 1))];
			await window.nativeWrapper.bluetoothSendToServer(JSON.stringify(chunk));
			toSendBytes = toSendBytes.slice((this.chunkSize - 1));
		}
		await window.nativeWrapper.bluetoothSendToServer(JSON.stringify([0, ...toSendBytes]));
	}

	async terminate(): Promise<void> {
		await window.nativeWrapper.bluetoothTerminate();
	}
}
