import type { BluetoothConnectionResult } from "./IBluetoothTransport";

export interface IMdocAppCommunication {
	generateEngagementQR(credential: any) :Promise<string>;
	startClient(onDeviceSelected?: () => void) :Promise<BluetoothConnectionResult>;
	getMdocRequest() :Promise<{ fields: string[]; credentialMatchesRequest: boolean; requestedDocType: string | null; credentialDocType: string }>;
	sendMdocResponse() :Promise<void>;
	terminateSession() :Promise<void>;
}
