import React, { useRef, useEffect, useState, useCallback, useContext } from "react";
import { useOpenID4VCI } from "../lib/services/OpenID4VCI/OpenID4VCI";
import OpenID4VCIContext from "./OpenID4VCIContext";
import IssuanceConsentPopup from "@/components/Popups/IssuanceConsentPopup";
import MessagePopup from "@/components/Popups/MessagePopup";
import SessionContext from "./SessionContext";

export const OpenID4VCIContextProvider = ({ children }) => {

	const { isLoggedIn } = useContext(SessionContext);

	const [popupConsentState, setPopupConsentState] = useState({
		isOpen: false,
		options: null,
		resolve: (value: unknown) => { },
		reject: () => { },
	});

	const showPopupConsent = useCallback((options): Promise<boolean> =>
		new Promise((resolve, reject) => {
			setPopupConsentState({
				isOpen: true,
				options,
				resolve,
				reject,
			});
		}), [popupConsentState]);

	const hidePopupConsent = useCallback(() => {
		setPopupConsentState((prevState) => ({
			...prevState,
			isOpen: false,
		}));
	}, [setPopupConsentState]);

	const [messagePopupState, setMessagePopupState] = useState<{
		type: 'error' | 'success',
		message: {
			title: string,
			description: string
		},
		onClose: (e) => Promise<void>
	} | null>(null);

	const showMessagePopup = useCallback((message) => {
		setMessagePopupState((prevState) => ({
			...prevState,
			isOpen: true,
			type: 'error',
			message: message,
			onClose: async () => { setMessagePopupState(null) }
		}))
	}, [setMessagePopupState]);

	const errorCallback = (title: string, msg: string) => {
		throw new Error("Not implemented");
	}

	const openID4VCI = useOpenID4VCI({ errorCallback, showPopupConsent, showMessagePopup });
	return (
		<OpenID4VCIContext.Provider value={{ openID4VCI }}>
			{children}
			{isLoggedIn && (
				<>
					<IssuanceConsentPopup popupConsentState={popupConsentState} setPopupConsentState={setPopupConsentState} showConsentPopup={showPopupConsent} hidePopupConsent={hidePopupConsent} />
					{messagePopupState && (
						<MessagePopup type={messagePopupState.type} message={messagePopupState.message} onClose={messagePopupState.onClose} />
					)}
				</>
			)}
		</OpenID4VCIContext.Provider>
	);
}
