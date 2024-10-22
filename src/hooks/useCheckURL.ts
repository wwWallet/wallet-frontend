import { useEffect, useState, Dispatch, SetStateAction, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import SessionContext from '../context/SessionContext';
import { BackgroundTasksContext } from '../context/BackgroundTasksContext';
import { useContainer } from './useContainer';
import { HandleAuthorizationRequestError } from '../lib/interfaces/IOpenID4VPRelyingParty';
import { generateRandomIdentifier } from '../lib/utils/generateRandomIdentifier';
import { StorableCredential } from '../lib/types/StorableCredential';
import { VerifiableCredentialFormat } from '../lib/schemas/vc';


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
	const { container } = useContainer();
	const { addLoader, removeLoader } = useContext(BackgroundTasksContext);

	const [showSelectCredentialsPopup, setShowSelectCredentialsPopup] = useState<boolean>(false);
	const [showPinInputPopup, setShowPinInputPopup] = useState<boolean>(false);
	const [selectionMap, setSelectionMap] = useState<{ [x: string]: string } | null>(null);
	const [conformantCredentialsMap, setConformantCredentialsMap] = useState(null);
	const [verifierDomainName, setVerifierDomainName] = useState("");
	const [showMessagePopup, setMessagePopup] = useState<boolean>(false);
	const [textMessagePopup, setTextMessagePopup] = useState<{ title: string, description: string }>({ title: "", description: "" });
	const [typeMessagePopup, setTypeMessagePopup] = useState<string>("");
	const { t } = useTranslation();


	async function handle(urlToCheck: string) {
		const userHandleB64u = keystore.getUserHandleB64u();
		if (!userHandleB64u) {
			throw new Error("User handle could not be extracted from keystore");
		}
		const u = new URL(urlToCheck);
		if (u.searchParams.get('credential_offer_uri') ) {
			const credentailOfferResponse = await fetch(u.searchParams.get('credential_offer_uri'));
			const credentialOffer = await credentailOfferResponse.json();

			if (!credentialOffer.grants['urn:ietf:params:oauth:grant-type:pre-authorized_code'] || !credentialOffer.credential_issuer) {
				return;
			}

			const body = {
				grant_type: 'urn:ietf:params:oauth:grant-type:pre-authorized_code',
				'pre-authorized_code': credentialOffer.grants['urn:ietf:params:oauth:grant-type:pre-authorized_code']['pre-authorized_code'],
			};

			const tokenResponse = await fetch(`${credentialOffer.credential_issuer}/token`, {
				method: 'POST',
				body: JSON.stringify(body),
				headers: {
					'Content-Type': 'application/json',
				}
			});
			const { access_token: accesToken, c_nonce: cNonce } = await tokenResponse.json();

			const openIdCredentialIssuerResponse = await fetch(`${credentialOffer.credential_issuer}/.well-known/openid-credential-issuer`, {
				headers: {
					'Cache-Control': 'no-cache',
				},
			});
			const openIdCredentialIssuer = await openIdCredentialIssuerResponse.json();
			// const metadata = OpenidCredentialIssuerMetadataSchema.parse(openIdCredentialIssuer);
			const metadata = openIdCredentialIssuer; // @todo: investigate schema errors

			const generateNonceProof = async (cNonce: string, audience: string, clientId: string): Promise<{ jws: string }> => {
				const [{ proof_jwt }] = await keystore.generateOpenid4vciProof(cNonce, audience, clientId);
				return { jws: proof_jwt };
			};

			const storeCredential = async (c: StorableCredential) => {
				await api.post('/storage/vc', {
					...c
				});
			};

			const credentialEndpoint = metadata.credential_endpoint;
			const credentialRequestHeaders = {
				'Authorization': `Bearer ${accesToken}`,
				'Content-Type': 'application/json',
			};

			const { jws } = await generateNonceProof(cNonce, metadata.credential_issuer, 'wwwallet');

			const credentialEndpointBody = {
				'proof': {
					'proof_type': 'jwt',
					'jwt': jws,
				},
				format: VerifiableCredentialFormat.JWT_VC_JSON, // @todo: retrieve from credential_configurations_supported
				...(metadata.credential_configurations_supported.AcademicBaseCredential), // @todo: retrieve from credential_configurations_supported
			};

			const didResponse = await fetch(`${credentialOffer.credential_issuer}/.well-known/did.json`, {
				headers: {
					'Cache-Control': 'no-cache',
				},
			});
			const did = await didResponse.json();

			const credentialResponse = await fetch(credentialEndpoint, {
				method: 'POST',
				body: JSON.stringify(credentialEndpointBody),
				headers: credentialRequestHeaders
			});
			const credential = await credentialResponse.json();

			await storeCredential({
				credentialConfigurationId: did.id,
				credentialIssuerIdentifier: credentialOffer.credential_issuer,
				credentialIdentifier: generateRandomIdentifier(32),
				credential: credential.credential,
				format: VerifiableCredentialFormat.JWT_VC_JSON, // @todo: retrieve from credential_configurations_supported
			});
		}
		else if (u.protocol === 'openid-credential-offer' || u.searchParams.get('credential_offer') || u.searchParams.get('credential_offer_uri') ) {
			for (const credentialIssuerIdentifier of Object.keys(container.openID4VCIClients)) {
				await container.openID4VCIClients[credentialIssuerIdentifier].handleCredentialOffer(u.toString())
					.then(({ credentialIssuer, selectedCredentialConfigurationSupported, issuer_state }) => {
						return container.openID4VCIClients[credentialIssuerIdentifier].generateAuthorizationRequest(selectedCredentialConfigurationSupported, userHandleB64u, issuer_state);
					})
					.then(({ url, client_id, request_uri }) => {
						window.location.href = url;
					})
					.catch((err) => console.error(err));
			}
		}
		else if (u.searchParams.get('code')) {
			for (const credentialIssuerIdentifier of Object.keys(container.openID4VCIClients)) {
				addLoader();
				await container.openID4VCIClients[credentialIssuerIdentifier].handleAuthorizationResponse(urlToCheck)
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
					else if (result.err === HandleAuthorizationRequestError.ONLY_ONE_INPUT_DESCRIPTOR_IS_SUPPORTED) {
						setTextMessagePopup({ title: `${t('messagePopup.onlyOneInputDescriptor.title')}`, description: `${t('messagePopup.onlyOneInputDescriptor.description')}` });
						setTypeMessagePopup('error');
						setMessagePopup(true);
					}
					else if (result.err == HandleAuthorizationRequestError.NONTRUSTED_VERIFIER) {
						setTextMessagePopup({ title: `${t('messagePopup.nonTrustedVerifier.title')}`, description: `${t('messagePopup.nonTrustedVerifier.description')}` });
						setTypeMessagePopup('error');
						setMessagePopup(true);
					}
					return;
				}
				const { conformantCredentialsMap, verifierDomainName } = result;
				const jsonedMap = Object.fromEntries(conformantCredentialsMap);
				window.history.replaceState({}, '', `${window.location.pathname}`);
				setVerifierDomainName(verifierDomainName);
				setConformantCredentialsMap(jsonedMap);
				setShowSelectCredentialsPopup(true);
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

	useEffect(() => {
		if (!isLoggedIn || !container || !urlToCheck || !keystore || !api || !t) {
			return;
		}
		handle(urlToCheck);
	}, [api, keystore, t, urlToCheck, isLoggedIn, container]);

	useEffect(() => {
		if (selectionMap) {
			container.openID4VPRelyingParty.sendAuthorizationResponse(new Map(Object.entries(selectionMap))).then(({ url }) => {
				if (url) {
					window.location.href = url;
				}
			}).catch((err) => console.error(err));
		}
	}, [api, keystore, selectionMap, t, container]);

	return { showSelectCredentialsPopup, setShowSelectCredentialsPopup, setSelectionMap, conformantCredentialsMap, showPinInputPopup, setShowPinInputPopup, verifierDomainName, showMessagePopup, setMessagePopup, textMessagePopup, typeMessagePopup };
}


export default useCheckURL;
