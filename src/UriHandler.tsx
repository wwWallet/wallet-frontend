import React, { useEffect, useState, useContext } from "react";
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

	const location = useLocation();
	const [url, setUrl] = useState(window.location.href);

	const { updateOnlineStatus } = useContext(StatusContext);
	const { isLoggedIn, keystore } = useContext(SessionContext);
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
	}, [location, updateOnlineStatus]);

	useEffect(() => {
		if (!isLoggedIn || !url || !keystore || !t || !openID4VCI || !openID4VP) {
			return;
		}

		async function handle(urlToCheck: string) {

			const u = new URL(urlToCheck);
			if (u.searchParams.size === 0) return;

			if (!keystore.getUserHandleB64u()) return;

			if (u.protocol === 'openid-credential-offer' || u.searchParams.get('credential_offer') || u.searchParams.get('credential_offer_uri')) {
				console.log("Handling Credential Offer ...");
				await handleCredentialOffer(u.toString(), openID4VCI);
			}
			else if (u.searchParams.get('code')) {
				console.log("Handling authorization response...");
				await handleAuthorizationResponse(u.toString(), openID4VCI, addLoader, removeLoader);
			}
			else if (u.searchParams.get('client_id') && u.searchParams.get('request_uri')) {
				console.log("Handling authorization Request...");
				await handleAuthorizationRequest(u.toString(), openID4VP, t, setMessagePopup, setTextMessagePopup, setTypeMessagePopup);
			}
			else if (url && isLoggedIn && u.searchParams.get('state') && u.searchParams.get('error') && u.searchParams.get('error_description')) {
				console.log("Handling Error...");
				handleError(u, setMessagePopup, setTextMessagePopup, setTypeMessagePopup);
			}
		}
		handle(url);
	}, [url, addLoader, removeLoader, t, keystore, isLoggedIn, openID4VCI, openID4VP]);

	// handleCredentialOffer
	const handleCredentialOffer = async (url: string, openID4VCI: any) => {
		try {
			const { credentialIssuer, selectedCredentialConfigurationId, issuer_state } = await openID4VCI.handleCredentialOffer(url);
			const res = await openID4VCI.generateAuthorizationRequest(credentialIssuer, selectedCredentialConfigurationId, issuer_state);
			if (res?.url) {
				window.location.href = res.url;
			}
		} catch (err) {
			console.error(err);
		}
	};

	// handleAuthorizationResponse
	const handleAuthorizationResponse = async (url: string, openID4VCI: any, addLoader: () => void, removeLoader: () => void) => {
		try {
			addLoader();
			await openID4VCI.handleAuthorizationResponse(url);
		} catch (err) {
			console.error("Error during the handling of authorization response", err);
			window.history.replaceState({}, "", `${window.location.pathname}`);
		} finally {
			removeLoader();
		}
	};

	// handleAuthorizationRequest
	const handleAuthorizationRequest = async (
		url: string,
		openID4VP: any,
		t: any,
		setMessagePopup: React.Dispatch<React.SetStateAction<boolean>>,
		setTextMessagePopup: React.Dispatch<React.SetStateAction<{ title: string; description: string }>>,
		setTypeMessagePopup: React.Dispatch<React.SetStateAction<string>>
	) => {
		try {
			const result = await openID4VP.handleAuthorizationRequest(url);
			if (result?.err) {
				handleAuthorizationError(result.err, t, setMessagePopup, setTextMessagePopup, setTypeMessagePopup);
				return;
			}
			const { conformantCredentialsMap, verifierDomainName } = result;
			const selection = await openID4VP.promptForCredentialSelection(
				Object.fromEntries(conformantCredentialsMap),
				verifierDomainName
			);
			if (selection instanceof Map) {
				const res = await openID4VP.sendAuthorizationResponse(selection);
				if (res?.url) window.location.href = res.url;
			}
		} catch (err) {
			console.error("Failed to handle authorization request", err);
		}
	};

	const handleAuthorizationError = (
		error: HandleAuthorizationRequestError,
		t: any,
		setMessagePopup: React.Dispatch<React.SetStateAction<boolean>>,
		setTextMessagePopup: React.Dispatch<React.SetStateAction<{ title: string; description: string }>>,
		setTypeMessagePopup: React.Dispatch<React.SetStateAction<string>>
	) => {
		const messages = {
			[HandleAuthorizationRequestError.INSUFFICIENT_CREDENTIALS]: {
				title: t("messagePopup.insufficientCredentials.title"),
				description: t("messagePopup.insufficientCredentials.description"),
			},
			[HandleAuthorizationRequestError.NONTRUSTED_VERIFIER]: {
				title: t("messagePopup.nonTrustedVerifier.title"),
				description: t("messagePopup.nonTrustedVerifier.description"),
			},
		};
		const message = messages[error];
		if (message) {
			setTextMessagePopup(message);
			setTypeMessagePopup("error");
			setMessagePopup(true);
		}
	};

	// handleError
	const handleError = (
		u: URL,
		setMessagePopup: React.Dispatch<React.SetStateAction<boolean>>,
		setTextMessagePopup: React.Dispatch<React.SetStateAction<{ title: string; description: string }>>,
		setTypeMessagePopup: React.Dispatch<React.SetStateAction<string>>
	) => {
		window.history.replaceState({}, "", `${window.location.pathname}`);
		setTextMessagePopup({
			title: u.searchParams.get("error")!,
			description: u.searchParams.get("error_description")!,
		});
		setTypeMessagePopup("error");
		setMessagePopup(true);
	};

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
