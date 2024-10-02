import { PresentationDefinitionType } from "../types/presentationDefinition.type";

export interface ICredentialParserRegistry {
	addParser(parser: ICredentialParser): void;
	parse(rawCredential: object | string, presentationDefinitionFilter?: PresentationDefinitionType): Promise<{ credentialFriendlyName: string; credentialImageURL: string; beautifiedForm: any; } | { error: string }>;
}

export interface ICredentialParser {
	/**
	 * 
	 * @param rawCredential 
	 * @param presentationDefinitionFilter if defined, then the befautified form will include only the attributes defined in the presentation definition. This can be used
	 * in the presentation flow when the user is prompted to select credentials to present
	 */
	parse(rawCredential: object | string, presentationDefinitionFilter?: PresentationDefinitionType): Promise<{ credentialFriendlyName: string; credentialImageURL: string; beautifiedForm: any; } | { error: string }>;
}
