import { BluetoothConnectionResult, IBluetoothTransport } from "../../interfaces/IBluetoothTransport";

// Minimal Web Bluetooth typings (subset of @types/web-bluetooth).
interface BluetoothRemoteGATTCharacteristic extends EventTarget {
	value?: DataView;
	writeValueWithoutResponse(value: BufferSource): Promise<void>;
	writeValue(value: BufferSource): Promise<void>;
	startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
	stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
}
interface BluetoothRemoteGATTService {
	getCharacteristic(uuid: string): Promise<BluetoothRemoteGATTCharacteristic>;
}
interface BluetoothRemoteGATTServer {
	connected: boolean;
	connect(): Promise<BluetoothRemoteGATTServer>;
	disconnect(): void;
	getPrimaryService(uuid: string): Promise<BluetoothRemoteGATTService>;
}
interface BluetoothDevice extends EventTarget {
	gatt?: BluetoothRemoteGATTServer;
}
interface Bluetooth {
	requestDevice(options: {
		filters?: { services?: string[] }[];
		optionalServices?: string[];
	}): Promise<BluetoothDevice>;
}

// ISO 18013-5 Annex A, mdoc central client mode GATT characteristics.
// The wallet (mdoc) is the GATT client; the reader is the GATT server
// advertising the service UUID from the device engagement.
const CHARACTERISTIC_STATE_UUID = "00000005-a123-48ce-896b-4c76973373e6";
const CHARACTERISTIC_CLIENT2SERVER_UUID = "00000006-a123-48ce-896b-4c76973373e6";
const CHARACTERISTIC_SERVER2CLIENT_UUID = "00000007-a123-48ce-896b-4c76973373e6";

// State characteristic commands
const STATE_START = 0x01;
const STATE_END = 0x02;
const GATT_CONNECT_TIMEOUT_MS = 15_000;

/**
 * Bluetooth transport backed by the Web Bluetooth API, for browsers without
 * the native wrapper. Implements the ISO 18013-5 BLE data retrieval GATT
 * profile in mdoc central client mode
 *
 * Note: connect() calls navigator.bluetooth.requestDevice(), which must run
 * within a user activation window (i.e. shortly after a user gesture)
 */
export class WebBluetoothTransport implements IBluetoothTransport {
	// Payload bytes per write, including the leading framing byte. Web Bluetooth
	// does not expose the negotiated ATT MTU, so stay under the common minimum
	// of larger negotiated MTUs (247 bytes => 244 usable per write)
	// Experimenting with various transports could lead to a better const or heuristic here
	private readonly chunkSize = 244;

	private device: BluetoothDevice | null = null;
	private server: BluetoothRemoteGATTServer | null = null;
	private stateCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
	private client2ServerCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
	private server2ClientCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

	// Chunks received from Server2Client notifications, waiting to be consumed
	private pendingChunks: Uint8Array[] = [];
	private chunkWaiter: { resolve: (chunk: Uint8Array) => void, reject: (err: Error) => void } | null = null;

	static isAvailable(): boolean {
		return typeof navigator !== "undefined" && !!(navigator as any).bluetooth;
	}

	async connect(serviceUuid: string, onDeviceSelected?: () => void): Promise<BluetoothConnectionResult> {
		try {
			const bluetooth: Bluetooth = (navigator as any).bluetooth;
			this.device = await bluetooth.requestDevice({
				filters: [{ services: [serviceUuid] }],
				optionalServices: [serviceUuid],
			});
			// browser device chooser is closed from here on
			onDeviceSelected?.();
			this.device.addEventListener("gattserverdisconnected", this.onDisconnected);
			const connectPromise = this.device.gatt.connect();
			this.server = await new Promise<BluetoothRemoteGATTServer>((resolve, reject) => {
				const timeoutId = setTimeout(() => {
					connectPromise
						.then((server) => server.connected && server.disconnect())
						.catch(() => {});
					reject(new Error("Timed out connecting to the Bluetooth verifier"));
				}, GATT_CONNECT_TIMEOUT_MS);
				connectPromise.then(
					(server) => {
						clearTimeout(timeoutId);
						resolve(server);
					},
					(error) => {
						clearTimeout(timeoutId);
						reject(error);
					}
				);
			});
			const service = await this.server.getPrimaryService(serviceUuid);
			this.stateCharacteristic = await service.getCharacteristic(CHARACTERISTIC_STATE_UUID);
			this.client2ServerCharacteristic = await service.getCharacteristic(CHARACTERISTIC_CLIENT2SERVER_UUID);
			this.server2ClientCharacteristic = await service.getCharacteristic(CHARACTERISTIC_SERVER2CLIENT_UUID);

			await this.server2ClientCharacteristic.startNotifications();
			this.server2ClientCharacteristic.addEventListener("characteristicvaluechanged", this.onServer2ClientNotification);

			// Signal "Start" to the reader
			await this.stateCharacteristic.writeValueWithoutResponse(new Uint8Array([STATE_START]));
			await new Promise((resolve) => setTimeout(resolve, 10));
			return "connected";
		} catch (e) {
			if ((e as DOMException)?.name === "NotFoundError") {
				await this.terminate();
				return "cancelled";
			}
			console.log(e);
			console.log("Could not initialize Web Bluetooth client");
			await this.terminate();
			return "failed";
		}
	}

	private onServer2ClientNotification = (event: Event): void => {
		const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
		if (!value) {
			return;
		}
		const chunk = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
		if (this.chunkWaiter) {
			const waiter = this.chunkWaiter;
			this.chunkWaiter = null;
			waiter.resolve(chunk);
		} else {
			this.pendingChunks.push(chunk);
		}
	};

	private onDisconnected = (): void => {
		if (this.chunkWaiter) {
			const waiter = this.chunkWaiter;
			this.chunkWaiter = null;
			waiter.reject(new Error("GATT server disconnected"));
		}
	};

	private nextChunk(): Promise<Uint8Array> {
		const chunk = this.pendingChunks.shift();
		if (chunk) {
			return Promise.resolve(chunk);
		}
		return new Promise((resolve, reject) => {
			this.chunkWaiter = { resolve, reject };
		});
	}

	async receiveMessage(): Promise<Uint8Array> {
		const parts: Uint8Array[] = [];
		let chunk: Uint8Array;
		do {
			chunk = await this.nextChunk();
			parts.push(chunk.slice(1));
		} while (chunk[0] === 1);

		const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
		const message = new Uint8Array(totalLength);
		let offset = 0;
		for (const part of parts) {
			message.set(part, offset);
			offset += part.length;
		}
		return message;
	}

	async sendMessage(payload: Uint8Array): Promise<void> {
		const maxPayloadPerChunk = this.chunkSize - 1;
		let offset = 0;
		while (payload.length - offset > maxPayloadPerChunk) {
			const chunk = new Uint8Array(this.chunkSize);
			chunk[0] = 1; // more chunks follow
			chunk.set(payload.subarray(offset, offset + maxPayloadPerChunk), 1);
			await this.client2ServerCharacteristic.writeValueWithoutResponse(chunk);
			await new Promise((resolve) => setTimeout(resolve, 10));
			offset += maxPayloadPerChunk;
		}
		const lastChunk = new Uint8Array(1 + payload.length - offset);
		lastChunk[0] = 0; // final chunk
		lastChunk.set(payload.subarray(offset), 1);
		await this.client2ServerCharacteristic.writeValueWithoutResponse(lastChunk);
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	async terminate(): Promise<void> {
		try {
			if (this.stateCharacteristic && this.server?.connected) {
				// Signal "End" to the reader
				await this.stateCharacteristic.writeValueWithoutResponse(new Uint8Array([STATE_END]));
				await new Promise((resolve) => setTimeout(resolve, 10));
			}
		} catch (e) {
			console.log("Failed to signal session end", e);
		}
		try {
			if (this.server2ClientCharacteristic && this.server?.connected) {
				this.server2ClientCharacteristic.removeEventListener("characteristicvaluechanged", this.onServer2ClientNotification);
				await this.server2ClientCharacteristic.stopNotifications();
			}
		} catch (e) {
			console.log("Failed to stop notifications", e);
		}
		if (this.device) {
			this.device.removeEventListener("gattserverdisconnected", this.onDisconnected);
		}
		if (this.server?.connected) {
			this.server.disconnect();
		}
		this.device = null;
		this.server = null;
		this.stateCharacteristic = null;
		this.client2ServerCharacteristic = null;
		this.server2ClientCharacteristic = null;
		this.pendingChunks = [];
		if (this.chunkWaiter) {
			const waiter = this.chunkWaiter;
			this.chunkWaiter = null;
			waiter.reject(new Error("Session terminated"));
		}
	}
}
