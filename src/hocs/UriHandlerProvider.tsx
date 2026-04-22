import React, { useEffect, useState, useContext, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import StatusContext from "../context/StatusContext";
import SessionContext from "../context/SessionContext";
import { useTranslation } from "react-i18next";
import type { OpenidCredentialIssuerMetadata } from "wallet-common";
import OpenID4VCIContext from "../context/OpenID4VCIContext";
import OpenID4VPContext from "../context/OpenID4VPContext";
import CredentialsContext from "@/context/CredentialsContext";
import { CachedUser } from "@/services/LocalStorageKeystore";
import SyncPopup from "@/components/Popups/SyncPopup";
import RedirectPopup from "@/components/Popups/RedirectPopup";
import { buildCredentialRedirectPopupContent } from "@/components/Popups/credentialRedirectPopupContent";
import { useSessionStorage } from "@/hooks/useStorage";
import useFilterItemByLang from "@/hooks/useFilterItemByLang";
import { getAuthorizationRequestErrorMessageKey } from "@/lib/services/OpenID4VP/authorizationRequestErrorMessageKey";

const MessagePopup = React.lazy(() => import('../components/Popups/MessagePopup'));
const PinInputPopup = React.lazy(() => import('../components/Popups/PinInput'));

export const UriHandlerProvider = ({ children }: React.PropsWithChildren) => {
	const { isOnline } = useContext(StatusContext);

	const filterItemByLang = useFilterItemByLang();

	const [usedAuthorizationCodes, setUsedAuthorizationCodes] = useState<string[]>([]);
	const [usedRequestUris, setUsedRequestUris] = useState<string[]>([]);
	const usedPreAuthorizedCodes = useRef<string[]>([]);

	const { isLoggedIn, api, keystore, logout } = useContext(SessionContext);
	const { syncPrivateData } = api;
	const { getUserHandleB64u, getCachedUsers, getCalculatedWalletState } = keystore;

	const location = useLocation();
	const [url, setUrl] = useState(window.location.href);

	const { openID4VCI } = useContext(OpenID4VCIContext);
	const { openID4VP } = useContext(OpenID4VPContext);

	const { handleCredentialOffer, generateAuthorizationRequest, handleAuthorizationResponse, requestCredentialsWithPreAuthorization } = openID4VCI;
	const { handleAuthorizationRequest, promptForCredentialSelection, sendAuthorizationResponse } = openID4VP;

	const [showPinInputPopup, setShowPinInputPopup] = useState<boolean>(false);

	const [showSyncPopup, setSyncPopup] = useState<boolean>(false);
	const [textSyncPopup, setTextSyncPopup] = useState<{ description: string }>({ description: "" });

	const [showMessagePopup, setMessagePopup] = useState<boolean>(false);
	const [textMessagePopup, setTextMessagePopup] = useState<{ title: string, description: string }>({ title: "", description: "" });
	const [typeMessagePopup, setTypeMessagePopup] = useState<string>("");
	const { t, i18n } = useTranslation();

	const [redirectUri, setRedirectUri] = useState<string | null>(null);
	const [popupRedirectUrl, setPopupRedirectUrl] = useState<string | null>(null);
	const [redirectPopupContent, setRedirectPopupContent] = useState<{ title: string, message: React.ReactNode }>({ title: "", message: "" });
	const [showRedirectPopup, setShowRedirectPopup] = useState<boolean>(false);
	const { vcEntityList } = useContext(CredentialsContext);

	const [cachedUser, setCachedUser] = useState<CachedUser | null>(null);
	const [synced, setSynced] = useState(false);
	const [latestIsOnlineStatus, setLatestIsOnlineStatus,] = api.useClearOnClearSession(useSessionStorage('latestIsOnlineStatus', null));

	useEffect(() => {
		if (!keystore || cachedUser !== null || !isLoggedIn) {
			return;
		}

		const userHandle = getUserHandleB64u();
		if (!userHandle) {
			return;
		}
		const u = getCachedUsers().filter((user) => user.userHandleB64u === userHandle)[0];
		if (u) {
			setCachedUser(u);
		}
	}, [keystore, getCachedUsers, getUserHandleB64u, setCachedUser, cachedUser, isLoggedIn]);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		if (window.location.search !== '' && params.get('sync') !== 'fail') {
			setSynced(false);
		}
	}, [location]);

	useEffect(() => {
		if (latestIsOnlineStatus === false && isOnline === true && cachedUser) {
			api.syncPrivateData(cachedUser);
		}
		if (isLoggedIn) {
			setLatestIsOnlineStatus(isOnline);
		} else {
			setLatestIsOnlineStatus(null);
		}
	}, [
		api,
		isLoggedIn,
		isOnline,
		latestIsOnlineStatus,
		setLatestIsOnlineStatus,
		cachedUser
	]);

	useEffect(() => {
		if (!getCalculatedWalletState || !cachedUser || !syncPrivateData) {
			return;
		}
		const params = new URLSearchParams(location.search);
		if (synced === false && getCalculatedWalletState() && params.get('sync') !== 'fail') {
			console.log("Actually syncing...");
			syncPrivateData(cachedUser).then((r) => {
				if (!r.ok) {
					return;
				}
				setSynced(true);
				// checkForUpdates();
				// updateOnlineStatus(false);
			});
		}

	}, [cachedUser, synced, setSynced, getCalculatedWalletState, syncPrivateData, location.search]);

	useEffect(() => {
		if (synced === true && window.location.search !== '') {
			setUrl(window.location.href);
		}
	}, [synced, setUrl, location]);

	const openRedirectPopup = (url: string, content: { title: string, message: React.ReactNode }) => {
		setPopupRedirectUrl(url);
		setRedirectPopupContent(content);
		setShowRedirectPopup(true);
	};

	const closeRedirectPopup = () => {
		setShowRedirectPopup(false);
		setPopupRedirectUrl(null);
		setRedirectPopupContent({ title: "", message: "" });
		setUrl(`${window.location.origin}${window.location.pathname}`);
		window.history.replaceState({}, '', `${window.location.pathname}`);
	};

	const popupContentFromIssuerMetadata = useCallback((
		issuerMetadata: OpenidCredentialIssuerMetadata,
		credentialConfigurationId: string
	) => buildCredentialRedirectPopupContent({
		t,
		credentialConfigurationId,
		issuerMetadata,
		filterItemByLang,
	}), [t, filterItemByLang]);

	const showErrorPopup = useCallback((
		errorKey: string,
		mappedDescriptionKey?: string,
	) => {
		const resolvedTitleKey = `messagePopup.${errorKey}.title`;
		const defaultDescriptionKey = `messagePopup.${errorKey}.defaultDescription`;
		const specificDescriptionKey = mappedDescriptionKey
			? `messagePopup.${errorKey}.${mappedDescriptionKey}`
			: undefined;
		const resolvedDescriptionKey = specificDescriptionKey && i18n.exists(specificDescriptionKey)
			? specificDescriptionKey
			: defaultDescriptionKey;

		setTextMessagePopup({
			title: t(resolvedTitleKey),
			description: t(resolvedDescriptionKey),
		});
		setTypeMessagePopup('error');
		setMessagePopup(true);
	}, [i18n, t]);

	const handleRedirectContinue = () => {
		if (popupRedirectUrl) {
			window.location.href = popupRedirectUrl;
		}
	};

	useEffect(() => {
		if (redirectUri) {
			window.location.href = redirectUri;
		}
	}, [redirectUri]);

	useEffect(() => {
		if (
			!isLoggedIn || !url || !t || !vcEntityList || !synced ||
			!handleCredentialOffer || !generateAuthorizationRequest || !handleAuthorizationResponse ||
			!handleAuthorizationRequest || !promptForCredentialSelection || !sendAuthorizationResponse
		) return;

		async function handle(urlToCheck: string) {
			const u = new URL(urlToCheck);
			if (u.searchParams.size === 0) return;
			// setUrl(window.location.origin);
			console.log('[Uri Handler]: check', url);
			setUrl('');

			if (u.protocol === 'openid-credential-offer' || u.searchParams.get('credential_offer') || u.searchParams.get('credential_offer_uri')) {
				handleCredentialOffer(u.toString()).then(({ credentialIssuer, selectedCredentialConfigurationId, issuer_state, preAuthorizedCode, txCode }) => {
					console.log("Generating authorization request...");
					if (!preAuthorizedCode) {
						return generateAuthorizationRequest(credentialIssuer, selectedCredentialConfigurationId, issuer_state);
					} else if (usedPreAuthorizedCodes.current.includes(preAuthorizedCode)) {
						throw new Error("Already used pre-authorized code");
					}

					let userInput: string | undefined = undefined;
					if (txCode) {
						while (1) {
							userInput = prompt(txCode.description ?? "Input Transaction Code displayed on your screen")
							if (txCode.length && txCode.length === userInput.length) {
								break;
							}
							else if (txCode.length) {
								alert(`Length of transaction code must be ${txCode.length}`);
							}
						}
					}
					usedPreAuthorizedCodes.current.push(preAuthorizedCode);
					return requestCredentialsWithPreAuthorization(credentialIssuer, selectedCredentialConfigurationId, preAuthorizedCode, userInput);
				}).then((res) => {
					if ('url' in res && typeof res.url === 'string' && res.url) {
						const popupContent = popupContentFromIssuerMetadata(res.issuerMetadata, res.credentialConfigurationId);

						openRedirectPopup(res.url, {
							title: popupContent.title,
							message: popupContent.message,
						});
					}
				}).catch(err => {
					setUrl(`${window.location.origin}${window.location.pathname}`);
					window.history.replaceState({}, '', `${window.location.pathname}`);
					showErrorPopup('addCredentialProcessFailed');
					console.error(err);
				})
				return;
			}
			else if (u.searchParams.get('code') && !usedAuthorizationCodes.includes(u.searchParams.get('code'))) {
				setUsedAuthorizationCodes((codes) => [...codes, u.searchParams.get('code')]);

				console.log("Handling authorization response...");
				handleAuthorizationResponse(u.toString()).then(() => {
				}).catch(err => {
					setUrl(`${window.location.origin}${window.location.pathname}`);
					console.log("Error during the handling of authorization response")
					window.history.replaceState({}, '', `${window.location.pathname}`);
					showErrorPopup('addCredentialProcessFailed');
					console.error('ERRRROR', err);
				})
			}
			else if (u.searchParams.get('client_id') && u.searchParams.get('request_uri') && !usedRequestUris.includes(u.searchParams.get('request_uri'))) {
				setUsedRequestUris((uriArray) => [...uriArray, u.searchParams.get('request_uri')]);
				await handleAuthorizationRequest(u.toString(), vcEntityList).then((result) => {
					console.log("Result = ", result);
					const { conformantCredentialsMap, verifierDomainName, verifierPurpose, parsedTransactionData } = result;
					const jsonedMap = Object.fromEntries(conformantCredentialsMap);
					console.log("Prompting for selection..")
					return promptForCredentialSelection(jsonedMap, verifierDomainName, verifierPurpose, parsedTransactionData);
				}).then((selection) => {
					if (!(selection instanceof Map)) {
						return;
					}
					console.log("Selection = ", selection);
					return sendAuthorizationResponse(selection, vcEntityList);

				}).then((res) => {
					if (res && 'url' in res && res.url) {
						setRedirectUri(res.url);
					}
				}).catch(err => {
					setUrl(`${window.location.origin}${window.location.pathname}`);
					console.log("Failed to handle authorization req");
					window.history.replaceState({}, '', `${window.location.pathname}`);
					showErrorPopup(
						'sendCredentialProcessFailed',
						getAuthorizationRequestErrorMessageKey(err),
					);
					console.error(err);
				})
				return;
			}

			const urlParams = new URLSearchParams(window.location.search);
			const state = urlParams.get('state');
			const error = urlParams.get('error');
			if (url && isLoggedIn && state && error) {
				setUrl(`${window.location.origin}${window.location.pathname}`);
				window.history.replaceState({}, '', `${window.location.pathname}`);
				const errorDescription = urlParams.get('error_description');
				setTextMessagePopup({ title: error, description: errorDescription });
				setTypeMessagePopup('error');
				setMessagePopup(true);
			}
		}
		if (getCalculatedWalletState()) {
			handle(url);
		}
	}, [
		url,
		t,
		isLoggedIn,
		vcEntityList,
		popupRedirectUrl,
		synced,
		getCalculatedWalletState,
		usedAuthorizationCodes,
		usedRequestUris,
		// depend on methods, not whole context objects
		popupContentFromIssuerMetadata,
		showErrorPopup,
		handleCredentialOffer,
		generateAuthorizationRequest,
		handleAuthorizationResponse,
		handleAuthorizationRequest,
		promptForCredentialSelection,
		sendAuthorizationResponse,
		requestCredentialsWithPreAuthorization,
	]);

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		if (synced === true && params.get('sync') === 'fail') {
			setSynced(false);
		}
		else if (params.get('sync') === 'fail' && synced === false) {
			setTextSyncPopup({ description: 'syncPopup.description' });
			setSyncPopup(true);
		} else {
			setSyncPopup(false);
		}
	}, [location, t, synced]);

	return (
		<>
			{children}
			{showPinInputPopup &&
				<PinInputPopup isOpen={showPinInputPopup} setIsOpen={setShowPinInputPopup} />
			}
			{showMessagePopup &&
				<MessagePopup type={typeMessagePopup} message={textMessagePopup} onClose={() => setMessagePopup(false)} />
			}
			{showSyncPopup &&
				<SyncPopup message={textSyncPopup}
					onClose={() => {
						setSyncPopup(false);
						logout();
					}}
				/>
			}
			{showRedirectPopup && popupRedirectUrl &&
				<RedirectPopup
					loading={false}
					onClose={closeRedirectPopup}
					handleContinue={handleRedirectContinue}
					popupTitle={redirectPopupContent.title}
					popupMessage={redirectPopupContent.message}
				/>
			}
		</>
	);
}
