export interface ICredentialParserRegistry {
	setParsers(parsers: ICredentialParser[]): void;
	parse(rawCredential: object | string): Promise<{ credentialFriendlyName: string; credentialImage: { credentialImageURL: string; }; beautifiedForm: any; } | { error: string }>;
}

export interface ICredentialParser {
	/**
	 * @param rawCredential
	 */
	parse(rawCredential: object | string): Promise<{ credentialFriendlyName: string; credentialImage: { credentialImageURL: string; }; beautifiedForm: any; } | { error: string }>;
}
