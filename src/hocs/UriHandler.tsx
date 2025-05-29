import React, { useEffect, useState, useContext, useRef } from "react";
import { useLocation } from "react-router-dom";
import checkForUpdates from "../offlineUpdateSW";
import StatusContext from "../context/StatusContext";
import SessionContext from "../context/SessionContext";
import { useTranslation } from "react-i18next";
import { HandleAuthorizationRequestError } from "../lib/interfaces/IOpenID4VP";
import OpenID4VCIContext from "../context/OpenID4VCIContext";
import OpenID4VPContext from "../context/OpenID4VPContext";
import CredentialsContext from "@/context/CredentialsContext";
import { CachedUser } from "@/services/LocalStorageKeystore";

const MessagePopup = React.lazy(() => import('../components/Popups/MessagePopup'));
const PinInputPopup = React.lazy(() => import('../components/Popups/PinInput'));

export const UriHandler = ({ children }) => {
	const { updateOnlineStatus } = useContext(StatusContext);

	const [usedAuthorizationCodes, setUsedAuthorizationCodes] = useState<string[]>([]);
	const [usedRequestUris, setUsedRequestUris] = useState<string[]>([]);

	const { isLoggedIn, api, keystore } = useContext(SessionContext);
	const location = useLocation();
	const [url, setUrl] = useState(window.location.href);

	const { openID4VCI } = useContext(OpenID4VCIContext);
	const { openID4VP } = useContext(OpenID4VPContext);

	const { handleCredentialOffer, generateAuthorizationRequest, handleAuthorizationResponse } = openID4VCI;
	const [showPinInputPopup, setShowPinInputPopup] = useState<boolean>(false);

	const [showMessagePopup, setMessagePopup] = useState<boolean>(false);
	const [textMessagePopup, setTextMessagePopup] = useState<{ title: string, description: string }>({ title: "", description: "" });
	const [typeMessagePopup, setTypeMessagePopup] = useState<string>("");
	const { t } = useTranslation();

	const [redirectUri, setRedirectUri] = useState(null);
	const { vcEntityList } = useContext(CredentialsContext);

	const [cachedUser, setCachedUser] = useState<CachedUser | null>(null);
	const [synced, setSynced] = useState(false);

	useEffect(() => {
		if (!keystore) {
			return;
		}
		const u = keystore.getCachedUsers().filter((user) => user.userHandleB64u === keystore.getUserHandleB64u())[0];
		if (u) {
			setCachedUser(u);
		}
	}, [keystore, setCachedUser]);

	useEffect(() => {
		if (!keystore || !cachedUser || !api) {
			return;
		}
		console.log("Location changed..")
		if (synced === false) {
			api.syncPrivateData(keystore, async () => false, cachedUser).then((r) => {
				if (!r.ok) {
					return;
				}
				setSynced(true);
				setUrl(window.location.href);
				checkForUpdates();
				updateOnlineStatus(false);
			});
		}

	}, [location, updateOnlineStatus, api, keystore, cachedUser, synced, setSynced]);

	useEffect(() => {
		if (redirectUri) {
			window.location.href = redirectUri;
		}
	}, [redirectUri]);

	useEffect(() => {
		if (!isLoggedIn || !url || !t || !openID4VCI || !openID4VP || !vcEntityList || !synced) {
			return;
		}

		async function handle(urlToCheck: string) {
			const u = new URL(urlToCheck);
			if (u.searchParams.size === 0) return;
			// setUrl(window.location.origin);
			console.log('[Uri Handler]: check', url);

			if (u.protocol === 'openid-credential-offer' || u.searchParams.get('credential_offer') || u.searchParams.get('credential_offer_uri')) {
				handleCredentialOffer(u.toString()).then(({ credentialIssuer, selectedCredentialConfigurationId, issuer_state }) => {
					console.log("Generating authorization request...");
					return generateAuthorizationRequest(credentialIssuer, selectedCredentialConfigurationId, issuer_state);
				}).then((res) => {
					if ('url' in res && res.url) {
						window.location.href = res.url;
					}
				})
					.catch(err => {
						window.history.replaceState({}, '', `${window.location.pathname}`);
						console.error(err);
					})
				return;
			}
			else if (u.searchParams.get('code') && !usedAuthorizationCodes.includes(u.searchParams.get('code'))) {
				setUsedAuthorizationCodes((codes) => [...codes, u.searchParams.get('code')]);

				console.log("Handling authorization response...");
				handleAuthorizationResponse(u.toString()).then(() => {
				}).catch(err => {
					console.log("Error during the handling of authorization response")
					window.history.replaceState({}, '', `${window.location.pathname}`);
					console.error(err)
				})
			}
			else if (u.searchParams.get('client_id') && u.searchParams.get('request_uri') && !usedRequestUris.includes(u.searchParams.get('request_uri'))) {
				setUsedRequestUris((uriArray) => [...uriArray, u.searchParams.get('request_uri')]);
				await openID4VP.handleAuthorizationRequest(u.toString(), vcEntityList).then((result) => {
					console.log("Result = ", result);
					if ('error' in result) {
						if (result.error === HandleAuthorizationRequestError.INSUFFICIENT_CREDENTIALS) {
							setTextMessagePopup({ title: `${t('messagePopup.insufficientCredentials.title')}`, description: `${t('messagePopup.insufficientCredentials.description')}` });
							setTypeMessagePopup('error');
							setMessagePopup(true);
						}
						else if (result.error === HandleAuthorizationRequestError.NONTRUSTED_VERIFIER) {
							setTextMessagePopup({ title: `${t('messagePopup.nonTrustedVerifier.title')}`, description: `${t('messagePopup.nonTrustedVerifier.description')}` });
							setTypeMessagePopup('error');
							setMessagePopup(true);
						}
						return;
					}
					const { conformantCredentialsMap, verifierDomainName, verifierPurpose } = result;
					const jsonedMap = Object.fromEntries(conformantCredentialsMap);
					console.log("Prompting for selection..")
					return openID4VP.promptForCredentialSelection(jsonedMap, verifierDomainName, verifierPurpose);
				}).then((selection) => {
					if (!(selection instanceof Map)) {
						return;
					}
					console.log("Selection = ", selection);
					return openID4VP.sendAuthorizationResponse(selection, vcEntityList);

				}).then((res) => {
					if (res && 'url' in res && res.url) {
						setRedirectUri(res.url);
					}
				}).catch(err => {
					console.log("Failed to handle authorization req");
					window.history.replaceState({}, '', `${window.location.pathname}`);
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
	}, [url, t, isLoggedIn, setRedirectUri, vcEntityList, synced]);

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

export default UriHandler;
