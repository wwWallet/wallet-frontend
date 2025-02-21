import React, { createContext } from "react";
import { IOpenID4VP } from "../lib/interfaces/IOpenID4VP";

export type OpenID4VPContextValue = {
	openID4VP: IOpenID4VP;
}

const OpenID4VPContext: React.Context<OpenID4VPContextValue> = createContext({
	openID4VP: null
});

export default OpenID4VPContext;
