import React, {useRef,useEffect} from "react";
import { useOpenID4VCI } from "../lib/services/OpenID4VCI/OpenID4VCI";
import OpenID4VCIContext from "./OpenID4VCIContext";

export const OpenID4VCIContextProvider = ({ children }) => {

	const errorCallback = (title: string, msg: string) => {
		throw new Error("Not implemented");
	}

	const openID4VCI = useOpenID4VCI({ errorCallback });
	return (
		<OpenID4VCIContext.Provider value={{ openID4VCI }}>
			{children}
		</OpenID4VCIContext.Provider>
	);
}
