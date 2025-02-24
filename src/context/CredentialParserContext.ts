import React, { createContext } from "react";
import { ParsedCredential } from "core/dist/types";

export type CredentialParserContextValue = {
	parseCredential: (rawCredential: unknown) => Promise<ParsedCredential | null>;
}

const CredentialParserContext: React.Context<CredentialParserContextValue> = createContext({
	parseCredential: async () => null,
});

export default CredentialParserContext;
