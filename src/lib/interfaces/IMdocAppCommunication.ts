import type { BluetoothConnectionResult } from "./IBluetoothTransport";

export interface MdocTypeDetails {
	requestedDocType: string | null;
	credentialDocType: string;
}

export interface MdocRequest extends MdocTypeDetails {
	fields: string[];
	credentialMatchesRequest: boolean;
}

export interface IMdocAppCommunication {
	generateEngagementQR(credential: any) :Promise<string>;
	startClient(onDeviceSelected?: () => void) :Promise<BluetoothConnectionResult>;
	getMdocRequest() :Promise<MdocRequest>;
	sendMdocResponse() :Promise<void>;
	terminateSession() :Promise<void>;
}
