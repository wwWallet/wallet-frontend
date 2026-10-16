import { createContext, useContext } from "react";
import { IOpenID4VCI } from "../lib/interfaces/IOpenID4VCI";

export type OpenID4VCIContextValue = {
	openID4VCI: IOpenID4VCI;
}

const OpenID4VCIContext = createContext<OpenID4VCIContextValue | undefined>(undefined);

export function useOpenID4VCIContext(): OpenID4VCIContextValue {
	const value = useContext(OpenID4VCIContext);
	if (value === undefined) {
		throw new Error('useOpenID4VCIContext must be used within OpenID4VCIContextProvider');
	}
	return value;
}

export default OpenID4VCIContext;
