import React, { useState, useContext, createContext, useCallback } from "react";
import SelectCredentialsPopup from "../components/Popups/SelectCredentialsPopup";
import CredentialsContext from '../context/CredentialsContext';
import { useOpenID4VP } from "../lib/services/OpenID4VP/OpenID4VP";
import { IOpenID4VP } from "../lib/interfaces/IOpenID4VP";

export type OpenID4VPContextValue = {
	openID4VP: IOpenID4VP;
}

const OpenID4VPContext: React.Context<OpenID4VPContextValue> = createContext({
	openID4VP: null
});

export const OpenID4VPContextProvider = ({ children }) => {
	const { vcEntityList } = useContext<any>(CredentialsContext);

	const [popupState, setPopupState] = useState({
		isOpen: false,
		options: null,
		resolve: (value: unknown) => { },
		reject: () => { },
	});

	const showPopup = useCallback((options): Promise<Map<string, string>> =>
		new Promise((resolve, reject) => {
			setPopupState({
				isOpen: true,
				options,
				resolve,
				reject,
			});
		}), []);

	const hidePopup = useCallback(() => {
		setPopupState((prevState) => ({
			...prevState,
			isOpen: false,
		}));
	}, []);

	const showCredentialSelectionPopup = useCallback(
		async (conformantCredentialsMap: Map<string, string[]>, verifierDomainName: string): Promise<Map<string, string>> => {
			return showPopup({ conformantCredentialsMap, verifierDomainName });
		},
		[showPopup]
	);

	const openID4VP = useOpenID4VP({ showCredentialSelectionPopup });

	return (
		<OpenID4VPContext.Provider value={{ openID4VP }}>
			{children}
			<SelectCredentialsPopup popupState={popupState} setPopupState={setPopupState} showPopup={showPopup} hidePopup={hidePopup} vcEntityList={vcEntityList} />
		</OpenID4VPContext.Provider>
	);
}

export const withOpenID4VPContext: <P>(component: React.ComponentType<P>) => React.ComponentType<P> = (Component) =>
	(props) => (
		<OpenID4VPContextProvider>
			<Component {...props} />
		</OpenID4VPContextProvider>
	);
export default OpenID4VPContext;
