import React, { useCallback, useContext, useState, useEffect } from "react";
import { ParsedCredential } from "core/dist/types";
import { useHttpProxy } from "@/lib/services/HttpProxy/HttpProxy";
import { initializeCredentialEngine } from "../lib/initializeCredentialEngine";
import CredentialParserContext from "./CredentialParserContext";
import { useOpenID4VCIHelper } from "@/lib/services/OpenID4VCIHelper";
import SessionContext from "./SessionContext";

export const CredentialParserContextProvider = ({ children }) => {

	const httpProxy = useHttpProxy();
	const helper = useOpenID4VCIHelper();

	const [issuers, setIssuers] = useState<Record<string, unknown>[] | null>(null);
	const { api } = useContext(SessionContext);

	useEffect(() => {
		api
			.getExternalEntity("/issuer/all", undefined, true)
			.then((res) => {
				setIssuers(res.data);
			})
			.catch(() => null);
	}, [api]);

	// Function to parse credentials
	const parseCredential = useCallback(async (rawCredential: unknown): Promise<ParsedCredential | null> => {
		try {

			const { credentialParsingEngine } = await initializeCredentialEngine(httpProxy, helper, issuers, []);

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

	}, [httpProxy, helper, issuers]);

	return (
		<CredentialParserContext.Provider value={{ parseCredential }}>
			{children}
		</CredentialParserContext.Provider>
	);
}
