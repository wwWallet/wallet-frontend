import type { BluetoothConnectionResult } from "./IBluetoothTransport";

export interface IMdocAppCommunication {
	generateEngagementQR(credential: any) :Promise<string>;
	startClient() :Promise<BluetoothConnectionResult>;
	getMdocRequest() :Promise<{ fields: string[]; credentialMatchesRequest: boolean }>;
	sendMdocResponse() :Promise<void>;
	terminateSession() :Promise<void>;
}
