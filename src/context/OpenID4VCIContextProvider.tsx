import React, { useRef, useEffect, useState, useCallback } from "react";
import { useOpenID4VCI } from "../lib/services/OpenID4VCI/OpenID4VCI";
import OpenID4VCIContext from "./OpenID4VCIContext";
import IssuanceConsentPopup from "@/components/Popups/IssuanceConsentPopup";

export const OpenID4VCIContextProvider = ({ children }) => {

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

	const errorCallback = (title: string, msg: string) => {
		throw new Error("Not implemented");
	}

	const openID4VCI = useOpenID4VCI({ errorCallback, showPopupConsent });
	return (
		<OpenID4VCIContext.Provider value={{ openID4VCI }}>
			{children}
			<IssuanceConsentPopup popupConsentState={popupConsentState} setPopupConsentState={setPopupConsentState} showConsentPopup={showPopupConsent} hidePopupConsent={hidePopupConsent} />
		</OpenID4VCIContext.Provider>
	);
}
