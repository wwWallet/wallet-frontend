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

	const [credentialEngine, setCredentialEngine] = useState(null);

	useEffect(() => {
		if (issuers) {
			initializeCredentialEngine(httpProxy, helper, issuers, []).then((e) => setCredentialEngine(e)).catch(() => null)
		}
	}, [httpProxy, helper, issuers]);

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
			const result = await credentialEngine.credentialParsingEngine.parse({ rawCredential });
			if (result.success) {
				return result.value;
			}
			return null;
		}
		catch (err) {
			console.error(err);
			return null;
		}

	}, [httpProxy, helper, issuers, credentialEngine]);

	if (credentialEngine) {
		return (
			<CredentialParserContext.Provider value={{ parseCredential }}>
				{children}
			</CredentialParserContext.Provider>
		);
	}
	else {
		return <></>
	}

}
