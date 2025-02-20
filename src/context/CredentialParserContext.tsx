import React, { createContext, useCallback } from "react";
import { ParsingEngine, VerifyingEngine, PublicKeyResolverEngine, SDJWTVCParser, SDJWTVCVerifier } from 'core';
import { ParsedCredential, VerifiableCredentialFormat } from "core/dist/types";
import { IHttpProxy } from "../lib/interfaces/IHttpProxy";
import { useHttpProxy } from "../lib/services/HttpProxy/HttpProxy";
import { CLOCK_TOLERANCE } from "../config";

export type CredentialParserContextValue = {
	parseCredential: (rawCredential: unknown) => Promise<ParsedCredential | null>;

}

const CredentialParserContext: React.Context<CredentialParserContextValue> = createContext({
	parseCredential: async () => null,
});


export function initializeCredentialEngine(httpProxy: IHttpProxy) {

	const ctx = {
		clockTolerance: CLOCK_TOLERANCE,
		subtle: crypto.subtle,
		lang: 'en-US',
		trustedCertificates: [],
	};
	const credentialParsingEngine = ParsingEngine();
	credentialParsingEngine.register(SDJWTVCParser({ context: ctx, httpClient: httpProxy }));

	const pkResolverEngine = PublicKeyResolverEngine();
	const verifyingEngine = VerifyingEngine();
	verifyingEngine.register(SDJWTVCVerifier({ context: ctx, pkResolverEngine: pkResolverEngine }));
	return { credentialParsingEngine, verifyingEngine };
}

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
		catch(err) {
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

export const withCredentialParserContext: <P>(component: React.ComponentType<P>) => React.ComponentType<P> = (Component) =>
	(props) => (
		<CredentialParserContextProvider>
			<Component {...props} />
		</CredentialParserContextProvider>
	);
export default CredentialParserContext;
