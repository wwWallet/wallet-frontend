export interface IMdocAppCommunication {
	generateEngagementQR(credential: any) :Promise<string>;
	startClient() :Promise<boolean>;
	getMdocRequest() :Promise<string[]>;
	sendMdocResponse() :Promise<void>;
	terminateSession() :Promise<void>;
}
