import React, { createContext } from "react";
import { IOpenID4VCI } from "../lib/interfaces/IOpenID4VCI";

export type OpenID4VPContextValue = {
	openID4VCI: IOpenID4VCI;
}

const OpenID4VCIContext: React.Context<OpenID4VPContextValue> = createContext({
	openID4VCI: null
});


export default OpenID4VCIContext;
