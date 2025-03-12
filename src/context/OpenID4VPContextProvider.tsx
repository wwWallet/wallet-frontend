import React, { useState, useContext, useCallback } from "react";
import SelectCredentialsPopup from "../components/Popups/SelectCredentialsPopup";
import CredentialsContext from "./CredentialsContext";
import { useOpenID4VP } from "../lib/services/OpenID4VP/OpenID4VP";
import OpenID4VPContext from "./OpenID4VPContext";
import MessagePopup from "@/components/Popups/MessagePopup";

export const OpenID4VPContextProvider = ({ children }) => {
	const { vcEntityList } = useContext<any>(CredentialsContext);

	const [popupState, setPopupState] = useState({
		isOpen: false,
		options: null,
		resolve: (value: unknown) => { },
		reject: () => { },
	});

	const [messagePopupState, setMessagePopupState] = useState<{
		type: 'error' | 'success',
		message: {
			title: string,
			description: string
		},
		onClose: (e) => Promise<void>
	} | null>(null);

	const showPopup = useCallback((options): Promise<Map<string, string>> =>
		new Promise((resolve, reject) => {
			setPopupState({
				isOpen: true,
				options,
				resolve,
				reject,
			});
		}), [popupState]);

	const hidePopup = useCallback(() => {
		setPopupState((prevState) => ({
			...prevState,
			isOpen: false,
		}));
	}, []);

	const showStatusPopup = useCallback(
		async (message: { title: string, description: string }, type: 'error' | 'success'): Promise<void> => {
			setMessagePopupState({
				message,
				type,
				onClose: async () => {
					setMessagePopupState(null);
				}
			})
		}
	);

	const showCredentialSelectionPopup = useCallback(
		async (conformantCredentialsMap: Map<string, string[]>, verifierDomainName: string, verifierPurpose: string): Promise<Map<string, string>> => {
			return showPopup({ conformantCredentialsMap, verifierDomainName, verifierPurpose });
		},
		[showPopup]
	);

	const openID4VP = useOpenID4VP({ showCredentialSelectionPopup, showStatusPopup });

	return (
		<OpenID4VPContext.Provider value={{ openID4VP }}>
			{children}
			<SelectCredentialsPopup popupState={popupState} setPopupState={setPopupState} showPopup={showPopup} hidePopup={hidePopup} vcEntityList={vcEntityList} />
			{messagePopupState !== null ?
				<MessagePopup type={messagePopupState.type} message={messagePopupState.message} onClose={messagePopupState.onClose} />
				: <></>
			}

		</OpenID4VPContext.Provider>
	);
}
