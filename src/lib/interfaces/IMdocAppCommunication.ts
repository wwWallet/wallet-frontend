export interface IMdocAppCommunication {
	generateEngagementQR(credential: any) :Promise<string>;
	startClient() :Promise<boolean>;
	getMdocRequest() :Promise<{ fields: string[]; credentialMatchesRequest: boolean }>;
	sendMdocResponse() :Promise<void>;
	terminateSession() :Promise<void>;
}
