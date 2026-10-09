import React, { useState, useCallback } from "react";
import { useOpenID4VCI } from "../lib/services/OpenID4VCI/OpenID4VCI";
import OpenID4VCIContext from "./OpenID4VCIContext";
import IssuanceConsentPopup from "@/components/Popups/IssuanceConsentPopup";
import MessagePopup from "@/components/Popups/MessagePopup";
import { useSessionContext } from "./SessionContext";
import { useOpenID4VCIClientStateRepository } from "@/lib/services/OpenID4VCIClientStateRepository";
import type { ConsentPopupState, IssuanceConsentOptions } from '@/types/consent';

export const OpenID4VCIContextProvider = ({ children }: React.PropsWithChildren) => {

	const { isLoggedIn } = useSessionContext();
	const openID4VCIClientStateRepository = useOpenID4VCIClientStateRepository();
	const { isInitialized } = openID4VCIClientStateRepository;

	const [popupConsentState, setPopupConsentState] = useState<ConsentPopupState<IssuanceConsentOptions>>({
		isOpen: false,
		options: null,
		resolve: () => { },
		reject: () => { },
	});

	const showPopupConsent = useCallback((options: IssuanceConsentOptions): Promise<boolean> =>
		new Promise((resolve, reject) => {
			setPopupConsentState({
				isOpen: true,
				options,
				resolve,
				reject,
			});
		}), []);

	const [messagePopupState, setMessagePopupState] = useState<{
		type: 'error' | 'success' | 'info',
		message: {
			title: string,
			description: string
		},
		onClose: () => Promise<void>
	} | null>(null);

	const showMessagePopup = useCallback((message: { title: string, description: string }, type: 'error' | 'success' | 'info' = 'error') => {
		setMessagePopupState((prevState) => ({
			...prevState,
			isOpen: true,
			type,
			message: message,
			onClose: async () => { setMessagePopupState(null) }
		}))
	}, [setMessagePopupState]);

	const errorCallback = (title: string, msg: string) => {
		throw new Error("Not implemented");
	}

	const openID4VCI = useOpenID4VCI({ errorCallback, showPopupConsent, showMessagePopup, openID4VCIClientStateRepository });

	if (isLoggedIn && isInitialized && !isInitialized()) {
		return <></>
	}
	return (
		<OpenID4VCIContext.Provider value={{ openID4VCI }}>
			{children}
			{isLoggedIn && (
				<>
					<IssuanceConsentPopup popupConsentState={popupConsentState} setPopupConsentState={setPopupConsentState} />
					{messagePopupState && (
						<MessagePopup type={messagePopupState.type} message={messagePopupState.message} onClose={messagePopupState.onClose} />
					)}
				</>
			)}
		</OpenID4VCIContext.Provider>
	);
}
