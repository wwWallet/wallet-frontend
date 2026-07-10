/**
 * Transport abstraction for the ISO 18013-5 proximity presentation flow.
 *
 * The wallet always acts in "mdoc central client mode": it connects as a
 * BLE GATT client to the verifier (reader), which runs a GATT server
 * advertising the service UUID announced in the device engagement.
 *
 * Implementations exchange complete session-layer messages; the BLE
 * fragmentation scheme of ISO 18013-5 (a leading byte of 0x01 for
 * intermediate chunks and 0x00 for the final chunk) is handled internally.
 */
export interface IBluetoothTransport {
	/**
	 * Connect to the reader advertising the given BLE service UUID.
	 * Returns true if the connection was established.
	 */
	connect(serviceUuid: string): Promise<boolean>;

	/** Receive one complete session message (chunks reassembled, framing bytes stripped). */
	receiveMessage(): Promise<Uint8Array>;

	/** Send one complete session message (fragmented into chunks as needed). */
	sendMessage(payload: Uint8Array): Promise<void>;

	/** Tear down the connection and release any Bluetooth resources. */
	terminate(): Promise<void>;
}
