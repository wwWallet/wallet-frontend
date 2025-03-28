export interface IMdocAppCommunication {
	ephemeralKey: CryptoKeyPair;
	uuid: string;
	deviceEngagementBytes: any;
	credential: any;
	assumedChunkSize: number;
	sessionDataEncoded: Buffer;
	generateEngagementQR(credential: any) :Promise<string>;
	startClient() :Promise<boolean>;
	getMdocRequest() :Promise<string[]>;
	sendMdocResponse() :Promise<void>;
}
