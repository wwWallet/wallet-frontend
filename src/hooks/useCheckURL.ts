import { useEffect, useState, Dispatch, SetStateAction, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import SessionContext from '../context/SessionContext';
import { BackgroundTasksContext } from '../context/BackgroundTasksContext';
import ContainerContext from '../context/ContainerContext';
import { HandleAuthorizationRequestError } from '../lib/interfaces/IOpenID4VPRelyingParty';

function useCheckURL(urlToCheck: string): {
	showSelectCredentialsPopup: boolean,
	setShowSelectCredentialsPopup: Dispatch<SetStateAction<boolean>>,
	setSelectionMap: Dispatch<SetStateAction<{ [x: string]: string } | null>>,
	conformantCredentialsMap: any,
	showPinInputPopup: boolean,
	setShowPinInputPopup: Dispatch<SetStateAction<boolean>>,
	verifierDomainName: string,
	showMessagePopup: boolean;
	setMessagePopup: Dispatch<SetStateAction<boolean>>;
	textMessagePopup: { title: string, description: string };
	typeMessagePopup: string;
} {
	const { api, isLoggedIn, keystore } = useContext(SessionContext);
	const { addLoader, removeLoader } = useContext(BackgroundTasksContext);
	const container = useContext(ContainerContext);

	const [showSelectCredentialsPopup, setShowSelectCredentialsPopup] = useState<boolean>(false);
	const [showPinInputPopup, setShowPinInputPopup] = useState<boolean>(false);
	const [selectionMap, setSelectionMap] = useState<{ [x: string]: string } | null>(null);
	const [conformantCredentialsMap, setConformantCredentialsMap] = useState(null);
	const [verifierDomainName, setVerifierDomainName] = useState("");
	const [showMessagePopup, setMessagePopup] = useState<boolean>(false);
	const [textMessagePopup, setTextMessagePopup] = useState<{ title: string, description: string }>({ title: "", description: "" });
	const [typeMessagePopup, setTypeMessagePopup] = useState<string>("");
	const { t } = useTranslation();

	useEffect(() => {
		if (!isLoggedIn || !container || !urlToCheck || !keystore || !api || !t) {
			return;
		}

		async function handle(urlToCheck: string) {
			const userHandleB64u = keystore.getUserHandleB64u();
			if (!userHandleB64u) {
				return;
			}
			const u = new URL(urlToCheck);
			if (u.protocol === 'openid-credential-offer' || u.searchParams.get('credential_offer') || u.searchParams.get('credential_offer_uri')) {
				for (const credentialIssuerIdentifier of Object.keys(container.openID4VCIClients)) {
					await container.openID4VCIClients[credentialIssuerIdentifier].handleCredentialOffer(u.toString(), userHandleB64u)
						.then(({ credentialIssuer, selectedCredentialConfigurationId, issuer_state }) => {
							return container.openID4VCIClients[credentialIssuerIdentifier].generateAuthorizationRequest(selectedCredentialConfigurationId, userHandleB64u, issuer_state);
						})
						.then(({ url }) => {
							if (url) {
								window.location.href = url;
							}
						})
						.catch((err) => console.error(err));
				}
			}
			else if (u.searchParams.get('code')) {
				for (const credentialIssuerIdentifier of Object.keys(container.openID4VCIClients)) {
					addLoader();
					await container.openID4VCIClients[credentialIssuerIdentifier].handleAuthorizationResponse(urlToCheck, userHandleB64u)
						.then(() => {
							removeLoader();
						})
						.catch(err => {
							console.log("Error during the handling of authorization response")
							window.history.replaceState({}, '', `${window.location.pathname}`);
							console.error(err)
							removeLoader();
						});
				}
			}
			else {
				await container.openID4VPRelyingParty.handleAuthorizationRequest(urlToCheck).then((result) => {
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
					return container.openID4VPRelyingParty.promptForCredentialSelection(jsonedMap, verifierDomainName);
				}).then((selection) => {
					console.log("Selection = ", selection);
					return container.openID4VPRelyingParty.sendAuthorizationResponse(selection);
				}).then((res) => {
					if ('url' in res && res.url) {
						window.location.href = res.url;
					}
				}).catch(err => {
					console.log("Failed to handle authorization req");
					console.error(err)
				})
			}

			const urlParams = new URLSearchParams(window.location.search);
			const state = urlParams.get('state');
			const error = urlParams.get('error');
			if (urlToCheck && isLoggedIn && state && error) {
				window.history.replaceState({}, '', `${window.location.pathname}`);
				const errorDescription = urlParams.get('error_description');
				setTextMessagePopup({ title: error, description: errorDescription });
				setTypeMessagePopup('error');
				setMessagePopup(true);
			}
		}

		handle(urlToCheck);
	}, [api, keystore, t, urlToCheck, isLoggedIn, container, addLoader, removeLoader]);

	useEffect(() => {
		if (selectionMap) {
			console.log("Selection map was mutated...");
			container.openID4VPRelyingParty.sendAuthorizationResponse(new Map(Object.entries(selectionMap))).then((result) => {
				if ('url' in result && result.url) {
					window.location.href = result.url;
				}
			}).catch((err) => console.error(err));
		}
	}, [selectionMap, container]);

	return { showSelectCredentialsPopup, setShowSelectCredentialsPopup, setSelectionMap, conformantCredentialsMap, showPinInputPopup, setShowPinInputPopup, verifierDomainName, showMessagePopup, setMessagePopup, textMessagePopup, typeMessagePopup };
}

export default useCheckURL;
