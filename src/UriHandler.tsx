import React, { useEffect, createContext, useState, useContext } from "react";
import { useLocation } from "react-router-dom";
import { checkForUpdates } from './offlineRegistrationSW';
import StatusContext from "./context/StatusContext";
import SessionContext from "./context/SessionContext";
import { BackgroundTasksContext } from "./context/BackgroundTasksContext";
import { useTranslation } from "react-i18next";
import { HandleAuthorizationRequestError } from "./lib/interfaces/IOpenID4VP";
import OpenID4VCIContext from "./context/OpenID4VCIContext";
import OpenID4VPContext from "./context/OpenID4VPContext";

const MessagePopup = React.lazy(() => import('./components/Popups/MessagePopup'));
const PinInputPopup = React.lazy(() => import('./components/Popups/PinInput'));



export const UriHandler = ({ children }) => {
	const { updateOnlineStatus } = useContext(StatusContext);

	const { isLoggedIn, keystore } = useContext(SessionContext);
	const location = useLocation();
	const [url, setUrl] = useState(window.location.href);

	const { openID4VCI } = useContext(OpenID4VCIContext);
	const { openID4VP } = useContext(OpenID4VPContext);

	const [showPinInputPopup, setShowPinInputPopup] = useState<boolean>(false);

	const [showMessagePopup, setMessagePopup] = useState<boolean>(false);
	const [textMessagePopup, setTextMessagePopup] = useState<{ title: string, description: string }>({ title: "", description: "" });
	const [typeMessagePopup, setTypeMessagePopup] = useState<string>("");
	const { addLoader, removeLoader } = useContext(BackgroundTasksContext);
	const { t } = useTranslation();

	useEffect(() => {
		setUrl(window.location.href);
		checkForUpdates();
		updateOnlineStatus(false);
	}, [location]);



	useEffect(() => {
		if (!isLoggedIn || !url || !keystore || !t || !openID4VCI || !openID4VP) {
			return;
		}

		async function handle(urlToCheck: string) {
			const userHandleB64u = keystore.getUserHandleB64u();
			if (!userHandleB64u) {
				return;
			}
			const u = new URL(urlToCheck);
			if (u.protocol === 'openid-credential-offer' || u.searchParams.get('credential_offer') || u.searchParams.get('credential_offer_uri')) {
				openID4VCI.handleCredentialOffer(u.toString()).then(({ credentialIssuer, selectedCredentialConfigurationId, issuer_state }) => {
					console.log("Generating authorization request...");
					return openID4VCI.generateAuthorizationRequest(credentialIssuer, selectedCredentialConfigurationId, issuer_state);
				}).then((res) => {
					if ('url' in res && res.url) {
						window.location.href = res.url;
					}
				})
					.catch((err) => console.error(err));
				return;
			}
			else if (u.searchParams.get('code')) {
				console.log("Handling authorization response...");
				addLoader();
				openID4VCI.handleAuthorizationResponse(u.toString()).then(() => {
					removeLoader();
				}).catch(err => {
					console.log("Error during the handling of authorization response")
					window.history.replaceState({}, '', `${window.location.pathname}`);
					console.error(err)
					removeLoader();
				})
			}
			else if (u.searchParams.get('client_id') && u.searchParams.get('request_uri')) {
				await openID4VP.handleAuthorizationRequest(u.toString()).then((result) => {
					console.log("Result = ", result);
					if ('err' in result) {
						if (result.err === HandleAuthorizationRequestError.INSUFFICIENT_CREDENTIALS) {
							setTextMessagePopup({ title: `${t('messagePopup.insufficientCredentials.title')}`, description: `${t('messagePopup.insufficientCredentials.description')}` });
							setTypeMessagePopup('error');
							setMessagePopup(true);
						}
						else if (result.err === HandleAuthorizationRequestError.NONTRUSTED_VERIFIER) {
							setTextMessagePopup({ title: `${t('messagePopup.nonTrustedVerifier.title')}`, description: `${t('messagePopup.nonTrustedVerifier.description')}` });
							setTypeMessagePopup('error');
							setMessagePopup(true);
						}
						return;
					}
					const { conformantCredentialsMap, verifierDomainName } = result;
					const jsonedMap = Object.fromEntries(conformantCredentialsMap);
					console.log("Prompting for selection..")
					return openID4VP.promptForCredentialSelection(jsonedMap, verifierDomainName);
				}).then((selection) => {
					if (!(selection instanceof Map)) {
						return;
					}
					console.log("Selection = ", selection);
					return openID4VP.sendAuthorizationResponse(selection);

				}).then((res) => {
					if (res && 'url' in res && res.url) {
						window.location.href = res.url;
					}
				}).catch(err => {
					console.log("Failed to handle authorization req");
					console.error(err);
				})
				return;
			}

			const urlParams = new URLSearchParams(window.location.search);
			const state = urlParams.get('state');
			const error = urlParams.get('error');
			if (url && isLoggedIn && state && error) {
				window.history.replaceState({}, '', `${window.location.pathname}`);
				const errorDescription = urlParams.get('error_description');
				setTextMessagePopup({ title: error, description: errorDescription });
				setTypeMessagePopup('error');
				setMessagePopup(true);
			}
		}
		handle(url);
	}, [url]);

	return (
		<>
			{children}
			{showPinInputPopup &&
				<PinInputPopup isOpen={showPinInputPopup} setIsOpen={setShowPinInputPopup} />
			}
			{showMessagePopup &&
				<MessagePopup type={typeMessagePopup} message={textMessagePopup} onClose={() => setMessagePopup(false)} />
			}
		</>
	);
}


export const withUriHandler: <P>(component: React.ComponentType<P>) => React.ComponentType<P> = (Component) =>
	(props) => (
		<UriHandler>
			<Component {...props} />
		</UriHandler>
	);
export default withUriHandler;
