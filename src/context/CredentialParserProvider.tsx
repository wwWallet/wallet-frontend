import React, { useCallback } from "react";
import { ParsedCredential } from "core/dist/types";
import { useHttpProxy } from "../lib/services/HttpProxy/HttpProxy";
import { initializeCredentialEngine } from "../lib/initializeCredentialEngine";
import CredentialParserContext from "./CredentialParserContext";

export const CredentialParserContextProvider = ({ children }) => {

	const httpProxy = useHttpProxy();

	// Function to parse credentials
	const parseCredential = useCallback(async (rawCredential: unknown): Promise<ParsedCredential | null> => {
		try {

			const { credentialParsingEngine } = initializeCredentialEngine(httpProxy);

			const result = await credentialParsingEngine.parse({ rawCredential });
			if (result.success) {
				return result.value;
			}
			return null;
		}
		catch (err) {
			console.error(err);
			return null;
		}

	}, [httpProxy]);

	return (
		<CredentialParserContext.Provider value={{ parseCredential }}>
			{children}
		</CredentialParserContext.Provider>
	);
}

