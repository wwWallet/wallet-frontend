import React, { useState, useContext, useCallback } from "react";
import SelectCredentialsPopup from "../components/Popups/SelectCredentialsPopup";
import CredentialsContext from "./CredentialsContext";
import { useOpenID4VP } from "../lib/services/OpenID4VP/OpenID4VP";
import OpenID4VPContext from "./OpenID4VPContext";
import GenericConsentPopup from "@/components/Popups/GenericConsentPopup";
import { useSessionContext } from "./SessionContext";
import { ParsedTransactionData } from "@/lib/services/OpenID4VP/TransactionData/parseTransactionData";


export const OpenID4VPContextProvider = ({ children }: React.PropsWithChildren) => {
	const { vcEntityList } = useContext<any>(CredentialsContext);
	const { isLoggedIn } = useSessionContext();

	type CredentialSelectionOptions = {
		conformantCredentialsMap: Map<string, string[]>,
		verifierDomainName: string,
		verifierPurpose: string,
		parsedTransactionData?: ParsedTransactionData[],
	};

	const [popupState, setPopupState] = useState<{
		isOpen: boolean,
		options: CredentialSelectionOptions | null,
		resolve: (value: Map<string, number>) => void,
		reject: () => void,
	}>({
		isOpen: false,
		options: null,
		resolve: () => { },
		reject: () => { },
	});

	const [popupConsentState, setPopupConsentState] = useState<{
		isOpen: boolean,
		options: Record<string, unknown> | null,
		resolve: (value: boolean) => void,
		reject: () => void,
	}>({
		isOpen: false,
		options: null,
		resolve: () => { },
		reject: () => { },
	});

	const showPopup = useCallback((options: CredentialSelectionOptions): Promise<Map<string, number>> =>
		new Promise((resolve, reject) => {
			setPopupState({
				isOpen: true,
				options,
				resolve,
				reject,
			});
		}), []);

	const showPopupConsent = useCallback((options: Record<string, unknown>): Promise<boolean> =>
		new Promise((resolve, reject) => {
			setPopupConsentState({
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

	const hidePopupConsent = useCallback(() => {
		setPopupConsentState((prevState) => ({
			...prevState,
			isOpen: false,
		}));
	}, [setPopupConsentState]);

	const showCredentialSelectionPopup = useCallback(
		async (
			conformantCredentialsMap: Map<string, string[]>,
			verifierDomainName: string,
			verifierPurpose: string,
			parsedTransactionData?: ParsedTransactionData[],
		): Promise<Map<string, number>> => {
			return showPopup({ conformantCredentialsMap, verifierDomainName, verifierPurpose, parsedTransactionData });
		},
		[showPopup]
	);

	const showTransactionDataConsentPopup = useCallback(
		async (options: Record<string, unknown>): Promise<boolean> => {
			return showPopupConsent(options);
		},
		[showPopupConsent]
	);

	const openID4VP = useOpenID4VP({ showCredentialSelectionPopup, showTransactionDataConsentPopup });

	return (
		<OpenID4VPContext.Provider value={{ openID4VP }}>
			{children}
			{isLoggedIn && (
				<>
					<GenericConsentPopup popupConsentState={popupConsentState} setPopupConsentState={setPopupConsentState} showConsentPopup={showPopupConsent} hidePopupConsent={hidePopupConsent} />
					<SelectCredentialsPopup popupState={popupState} setPopupState={setPopupState} showPopup={showPopup} hidePopup={hidePopup} vcEntityList={vcEntityList} />
				</>
			)}
		</OpenID4VPContext.Provider>
	);
}
