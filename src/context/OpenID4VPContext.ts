import { createContext, useContext } from "react";
import { IOpenID4VP } from "../lib/interfaces/IOpenID4VP";

export type OpenID4VPContextValue = {
	openID4VP: IOpenID4VP;
}

const OpenID4VPContext = createContext<OpenID4VPContextValue | undefined>(undefined);

export function useOpenID4VPContext(): OpenID4VPContextValue {
	const value = useContext(OpenID4VPContext);
	if (value === undefined) {
		throw new Error('useOpenID4VPContext must be used within OpenID4VPContextProvider');
	}
	return value;
}

export default OpenID4VPContext;
