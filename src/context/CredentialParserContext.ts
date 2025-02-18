import React, { createContext} from "react";
import { ICredentialParserRegistry } from "../lib/interfaces/ICredentialParser";

type CredentialParserContextValue = {
	credentialParserRegistry: ICredentialParserRegistry;
	parseCredential: (credential: string) => Promise<any>;

}

const CredentialParserContext: React.Context<CredentialParserContextValue> = createContext({
	credentialParserRegistry: null,
	parseCredential: async () => null,
});

export default CredentialParserContext;
