import React, { useEffect, useState, useContext, useRef, useCallback, Suspense } from "react";
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
import { useOpenID4VCIHelper } from "@/lib/services/OpenID4VCIHelper";
import { getAuthorizationRequestErrorMessageKey } from "@/lib/services/OpenID4VP/authorizationRequestErrorMessageKey";
import { getAuthorizationResponseErrorMessageKey } from "@/lib/services/OpenID4VCI/authorizationResponseErrorMessageKey";

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

	const [isMessagePopupOpen, setMessagePopup] = useState<boolean>(false);
	const [textMessagePopup, setTextMessagePopup] = useState<{ title: string, description: string }>({ title: "", description: "" });
	const [typeMessagePopup, setTypeMessagePopup] = useState<string>("");
	const { t, i18n } = useTranslation();

	const [redirectUri, setRedirectUri] = useState<string | null>(null);
	const [redirectPopupContent, setRedirectPopupContent] = useState<{ title: string, message: React.ReactNode }>({ title: "", message: "" });
	const [showRedirectPopup, setShowRedirectPopup] = useState<boolean>(false);
	const redirectPopupResolverRef = useRef<((approved: boolean) => void) | null>(null);
	const { vcEntityList } = useContext(CredentialsContext);
	const openID4VCIHelper = useOpenID4VCIHelper();

	const [cachedUser, setCachedUser] = useState<CachedUser | null>(null);
	const [synced, setSynced] = useState(false);
	const [latestIsOnlineStatus, setLatestIsOnlineStatus,] = api.useClearOnClearSession(useSessionStorage('latestIsOnlineStatus', null));

	const cleanCurrentUrl = useCallback(() => {
		const cleanPath = window.location.pathname;
		window.history.replaceState({}, '', cleanPath);
		setUrl(`${window.location.origin}${cleanPath}`);
	}, [setUrl]);

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

	const openRedirectPopup = (content: { title: string, message: React.ReactNode }, onResolve: (approved: boolean) => void) => {
		setRedirectPopupContent(content);
		redirectPopupResolverRef.current = onResolve;
		setShowRedirectPopup(true);
	};

	const closeRedirectPopup = () => {
		if (redirectPopupResolverRef.current) {
			redirectPopupResolverRef.current(false);
		}
		setShowRedirectPopup(false);
		redirectPopupResolverRef.current = null;
		setRedirectPopupContent({ title: "", message: "" });
		cleanCurrentUrl();
	};

	const confirmRedirectPopup = () => {
		if (redirectPopupResolverRef.current) {
			redirectPopupResolverRef.current(true);
		}
		setShowRedirectPopup(false);
		redirectPopupResolverRef.current = null;
		setRedirectPopupContent({ title: "", message: "" });
		cleanCurrentUrl();
	};

	const requestRedirectConsent = useCallback((content: { title: string, message: React.ReactNode }) => {
		return new Promise<boolean>((resolve) => {
			openRedirectPopup(content, resolve);
		});
	}, []);

	const popupContentFromIssuerMetadata = useCallback((
		issuerMetadata: OpenidCredentialIssuerMetadata,
		credentialConfigurationId: string
	) => buildCredentialRedirectPopupContent({
		t,
		credentialConfigurationId,
		issuerMetadata,
		filterItemByLang,
	}), [t, filterItemByLang]);

	const showMessagePopup = useCallback((
		messageOrErrorKey: string | { title: string, description: string },
		mappedDescriptionKey?: string,
		type: 'error' | 'success' | 'info' = 'error',
	) => {
		if (typeof messageOrErrorKey === 'string') {
			const errorKey = messageOrErrorKey;
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
			setTypeMessagePopup(type);
			setMessagePopup(true);
			return;
		}

		setTextMessagePopup(messageOrErrorKey);
		setTypeMessagePopup(type);
		setMessagePopup(true);
	}, [i18n, t]);

	useEffect(() => {
		if (redirectUri) {
			cleanCurrentUrl();
			window.location.href = redirectUri;
		}
	}, [cleanCurrentUrl, redirectUri]);

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
				handleCredentialOffer(u.toString()).then(async ({ credentialIssuer, selectedCredentialConfigurationId, issuer_state, preAuthorizedCode, txCode }) => {
					const metadataResult = await openID4VCIHelper.getCredentialIssuerMetadata(credentialIssuer);
					if (!metadataResult?.metadata) {
						throw new Error('Could not resolve issuer metadata for credential offer');
					}
					const popupContent = popupContentFromIssuerMetadata(metadataResult.metadata, selectedCredentialConfigurationId);
					const userApproved = await requestRedirectConsent({
						title: popupContent.title,
						message: popupContent.message,
					});
					if (!userApproved) {
						return null;
					}

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
					if (!res) {
						return;
					}
					if ('url' in res && typeof res.url === 'string' && res.url) {
						cleanCurrentUrl();
						window.location.href = res.url;
					}
				}).catch(err => {
					cleanCurrentUrl();
					showMessagePopup('addCredentialProcessFailed');
					console.error('Error during the handling of credential offer', err);
				})
				return;
			}
			else if (u.searchParams.get('code') && !usedAuthorizationCodes.includes(u.searchParams.get('code'))) {
				setUsedAuthorizationCodes((codes) => [...codes, u.searchParams.get('code')]);

				console.log("Handling authorization response...");
				handleAuthorizationResponse(u.toString()).then(() => {
				}).catch(err => {
					cleanCurrentUrl();
					showMessagePopup('addCredentialProcessFailed');
					console.error('Error during the handling of authorization response', err);
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
					// if (res.state === 'skipped') do nothing
					if (res?.redirect_uri) {
						setRedirectUri(res.redirect_uri);
					}
					else if (res?.state === 'success') {
						showMessagePopup('sendCredentialProcessSuccess', undefined, 'success');
					}
				}).catch(err => {
					cleanCurrentUrl();
					showMessagePopup(
						'sendCredentialProcessFailed',
						getAuthorizationRequestErrorMessageKey(err),
					);
					console.error('Failed to handle authorization req', err);
				})
				return;
			}
			else if (u.searchParams.get('error') && u.searchParams.get('state')) {
				cleanCurrentUrl();
				const error = u.searchParams.get('error');
				const errorDescription = u.searchParams.get('error_description');
				const mappedDescriptionKey = getAuthorizationResponseErrorMessageKey(error);
				showMessagePopup(
					'authorizationProcessFailed',
					mappedDescriptionKey
				);
				console.error('Authorization error', { error, error_description: errorDescription });
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
		synced,
		getCalculatedWalletState,
		usedAuthorizationCodes,
		usedRequestUris,
		// depend on methods, not whole context objects
		popupContentFromIssuerMetadata,
		requestRedirectConsent,
		showMessagePopup,
		handleCredentialOffer,
		generateAuthorizationRequest,
		handleAuthorizationResponse,
		handleAuthorizationRequest,
		promptForCredentialSelection,
		sendAuthorizationResponse,
		requestCredentialsWithPreAuthorization,
		openID4VCIHelper,
		cleanCurrentUrl,
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
			<Suspense fallback={null}>
				{showPinInputPopup &&
					<PinInputPopup isOpen={showPinInputPopup} setIsOpen={setShowPinInputPopup} />
				}
				{isMessagePopupOpen &&
					<MessagePopup type={typeMessagePopup} message={textMessagePopup} onClose={() => setMessagePopup(false)} />
				}
			</Suspense>
			{showSyncPopup &&
				<SyncPopup message={textSyncPopup}
					onClose={() => {
						setSyncPopup(false);
						logout();
					}}
				/>
			}
			{showRedirectPopup &&
				<RedirectPopup
					loading={false}
					onClose={closeRedirectPopup}
					handleContinue={confirmRedirectPopup}
					popupTitle={redirectPopupContent.title}
					popupMessage={redirectPopupContent.message}
				/>
			}
		</>
	);
}
