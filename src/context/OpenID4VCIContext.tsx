import React, { createContext } from "react";
import { IOpenID4VCI } from "../lib/interfaces/IOpenID4VCI";
import { OpenID4VCI } from "../lib/services/OpenID4VCI/OpenID4VCI";


export type OpenID4VPContextValue = {
	openID4VCI: IOpenID4VCI;
}

const OpenID4VCIContext: React.Context<OpenID4VPContextValue> = createContext({
	openID4VCI: null
});

export const OpenID4VCIContextProvider = ({ children }) => {

	const errorCallback = (title: string, msg: string) => {
		throw new Error("Not implemented");
	}

	const openID4VCI = OpenID4VCI({ errorCallback });
	return (
		<OpenID4VCIContext.Provider value={{ openID4VCI }}>
			{children}
		</OpenID4VCIContext.Provider>
	);
}

export const withOpenID4VCIContext: <P>(component: React.ComponentType<P>) => React.ComponentType<P> = (Component) =>
	(props) => (
		<OpenID4VCIContextProvider>
			<Component {...props} />
		</OpenID4VCIContextProvider>
	);
export default OpenID4VCIContext;
