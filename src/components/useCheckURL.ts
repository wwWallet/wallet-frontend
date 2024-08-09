import { useEffect, useState, Dispatch, SetStateAction, useContext } from 'react';
import { useApi } from '../api';
import { useTranslation } from 'react-i18next';
import SessionContext from '../context/SessionContext';

export enum HandleOutboundRequestError {
	INSUFFICIENT_CREDENTIALS = "INSUFFICIENT_CREDENTIALS",
}

export enum SendResponseError {
	SEND_RESPONSE_ERROR = "SEND_RESPONSE_ERROR",
}


function useCheckURL(urlToCheck: string): {
	showSelectCredentialsPopup: boolean,
	setShowSelectCredentialsPopup: Dispatch<SetStateAction<boolean>>,
	setSelectionMap: Dispatch<SetStateAction<string | null>>,
	conformantCredentialsMap: any,
	showPinInputPopup: boolean,
	setShowPinInputPopup: Dispatch<SetStateAction<boolean>>,
	verifierDomainName: string,
	showMessagePopup: boolean;
	setMessagePopup: Dispatch<SetStateAction<boolean>>;
	textMessagePopup: { title: string, description: string };
	typeMessagePopup: string;
} {
	const api = useApi();
	const { isLoggedIn, keystore } = useContext(SessionContext);
	const [showSelectCredentialsPopup, setShowSelectCredentialsPopup] = useState<boolean>(false);
	const [showPinInputPopup, setShowPinInputPopup] = useState<boolean>(false);
	const [selectionMap, setSelectionMap] = useState<string | null>(null);
	const [conformantCredentialsMap, setConformantCredentialsMap] = useState(null);
	const [verifierDomainName, setVerifierDomainName] = useState("");
	const [showMessagePopup, setMessagePopup] = useState<boolean>(false);
	const [textMessagePopup, setTextMessagePopup] = useState<{ title: string, description: string }>({ title: "", description: "" });
	const [typeMessagePopup, setTypeMessagePopup] = useState<string>("");
	const { t } = useTranslation();

	useEffect(() => {

		async function communicationHandler(url: string): Promise<boolean> {
			try {
				const wwwallet_camera_was_used = new URL(url).searchParams.get('wwwallet_camera_was_used');

				const res = await api.post('/communication/handle', { url, camera_was_used: (wwwallet_camera_was_used != null && wwwallet_camera_was_used === 'true') });
				const { redirect_to, conformantCredentialsMap, verifierDomainName, preauth, ask_for_pin, error } = res.data;
				if (error && error === HandleOutboundRequestError.INSUFFICIENT_CREDENTIALS) {
					console.error(`${HandleOutboundRequestError.INSUFFICIENT_CREDENTIALS}`);
					setTextMessagePopup({ title: `${t('messagePopup.insufficientCredentials.title')}`, description: `${t('messagePopup.insufficientCredentials.description')}` });
					setTypeMessagePopup('error');
					setMessagePopup(true);
					return false;
				}

				if (preauth && preauth === true) {
					if (ask_for_pin) {
						setShowPinInputPopup(true);
						return true;
					}
					else {
						await api.post('/communication/handle', { user_pin: "" });
						return true;
					}
				}

				if (redirect_to) {
					window.location.href = redirect_to;
					return true;
				} else if (conformantCredentialsMap) {
					console.log('need action');
					setVerifierDomainName(verifierDomainName);
					setConformantCredentialsMap(conformantCredentialsMap);
					setShowSelectCredentialsPopup(true);
					console.log("called setShowSelectCredentialsPopup")
					return true;
				}
				else {
					return false;
				}
			}
			catch (err) {
				console.log("Failed to handle");
				return false;
			}
		}

		if (urlToCheck && isLoggedIn && window.location.pathname === "/cb") {
			(async () => {
				await communicationHandler(urlToCheck);
			})();
		}

		if (urlToCheck && isLoggedIn) {
			const urlParams = new URLSearchParams(window.location.search);
			const state = urlParams.get('state');
			const error = urlParams.get('error');
			const errorDescription = urlParams.get('error_description');

			if (state && error) {
				setTextMessagePopup({ title: error, description: errorDescription });
				setTypeMessagePopup('error');
				setMessagePopup(true);
			}
		}

	}, [api, keystore, t, urlToCheck, isLoggedIn]);

	useEffect(() => {
		if (selectionMap) {
			console.log("Selected value = ", selectionMap);

			api.post("/communication/handle",
				{ verifiable_credentials_map: selectionMap },
			).then(success => {
				console.log(success);
				const { redirect_to, error } = success.data;

				if (error && error === SendResponseError.SEND_RESPONSE_ERROR) {
					setTextMessagePopup({ title: `${t('messagePopup.sendResponseError.title')}`, description: `${t('messagePopup.sendResponseError.description')}` });
					setTypeMessagePopup('error');
					setMessagePopup(true);
					return;
				}
				if (redirect_to) {
					window.location.href = redirect_to; // Navigate to the redirect URL
				}
				else {
					setTextMessagePopup({ title: `${t('messagePopup.sendResponseSuccess.title')}`, description: `${t('messagePopup.sendResponseSuccess.description')}` });
					setTypeMessagePopup('success');
					setMessagePopup(true);
					return;
				}
			}).catch(err => {
				console.error("Error");
				console.error(err);
			});
		}
	}, [api, keystore, selectionMap, t]);

	return { showSelectCredentialsPopup, setShowSelectCredentialsPopup, setSelectionMap, conformantCredentialsMap, showPinInputPopup, setShowPinInputPopup, verifierDomainName, showMessagePopup, setMessagePopup, textMessagePopup, typeMessagePopup };
}

export default useCheckURL;
