import { useContext, useEffect, useState } from 'react';
import ContainerContext from '../context/ContainerContext';
import SessionContext from '../context/SessionContext';
import { useTranslation } from 'react-i18next';
import MessagePopup from '../components/Popups/MessagePopup';
import { credentialOfferFromUrl } from '../lib/services/credential-offer.service';
import { useApi } from '../hooks/useApi';
import { getDid, getIssuerConfiguration } from '../lib/services/credential-issuer.service';
import StatusContext from '../context/StatusContext';
import {
	FIELD_PRE_AUTHORIZED_CODE,
	FIELD_PRE_AUTHORIZED_CODE_GRANT_TYPE,
	FIELD_AUTHORIZATION_CODE_GRANT_TYPE,
	generateNonceProof,
	getCredential,
	getToken,
} from '../lib/services/pre-authorized-code-flow.service';
import { generateRandomIdentifier } from '../lib/utils/generateRandomIdentifier';
import PinPopup from '../components/Popups/PinPopup';

type CredentialOfferHandlerProps = {
	url: string;
};

export const CredentialOfferHandler = ({
	url,
}: CredentialOfferHandlerProps) => {
	const { t } = useTranslation();
	const container = useContext(ContainerContext);
	const { isLoggedIn, keystore } = useContext(SessionContext);
	const { isOnline } = useContext(StatusContext);
	const api = useApi();
	const [showMessage, setShowMessage] = useState(false);
	const [isPinPopupOpen, setIsPinPopupOpen] = useState(false);
	const [pinLength, setPinLength] = useState(4);
	const [pin, setPin] = useState('');
	const [isPinRequired, setIsPinRequired] = useState(false);
	const [credentialIssuer, setCredentialIssuer] = useState('');
	const [preAuthorizedCode, setPreAuthorizedCode] = useState('');
	const [accessToken, setAccessToken] = useState('');
	const [nonce, setNonce] = useState('');
	const [credentialEndpoint, setCredentialEndpoint] = useState('');
	const [credentialConfiguration, setCredentialConfiguration] = useState<any>();
	const [failed, setFailed] = useState(false);

	// Pre-authorized code flow: Get token after entering PIN
	useEffect(() => {
		if (
			!isPinRequired ||
			!pin ||
			pin.length !== pinLength ||
			!credentialIssuer ||
			!preAuthorizedCode
		) {
			return;
		}

		const fetchToken = async () => {
			try {
				const { accessToken, cNonce } = await getToken(credentialIssuer, preAuthorizedCode, pin);
				setNonce(cNonce);
				setAccessToken(accessToken);
			} catch (error: unknown) {
				if (error instanceof Error) {
					console.log(error.message);
				}
				setShowMessage(true);
			}
		};

		fetchToken();
	}, [
		credentialIssuer,
		preAuthorizedCode,
		pin,
		pinLength,
		isPinRequired,
	]);

	// Finish pre-authorized code flow after getting token
	useEffect(() => {
		if (
			!nonce ||
			!accessToken ||
			!credentialIssuer ||
			!credentialConfiguration ||
			failed
		) {
			return;
		}

		const finishPreAuthorizedCodeFlow = async () => {
			try {
				// Generate proof
				const { jws } = await generateNonceProof(keystore, nonce, credentialIssuer, 'wwWallet', credentialConfiguration.format);

				// Get issuer did
				const did = await getDid(credentialIssuer);

				// Get credential
				const credential = await getCredential(
					credentialEndpoint,
					accessToken,
					jws,
					credentialConfiguration.format,
					credentialConfiguration,
				);

				// Store credential
				await api.post('/storage/vc', {
					credentials: [{
						credentialConfigurationId: did.id,
						credentialIssuerIdentifier: credentialIssuer,
						credentialIdentifier: generateRandomIdentifier(32),
						credential: credential.credential,
						format: credentialConfiguration.format,
					}],
				});

				window.location.href = '/';
			} catch (error: unknown) {
				if (error instanceof Error) {
					console.log(error.message);
				}
				setShowMessage(true);
				setFailed(true);
			}
		};

		finishPreAuthorizedCodeFlow();
	}, [
		nonce,
		accessToken,
		credentialIssuer,
		credentialEndpoint,
		credentialConfiguration,
		keystore,
		api,
		failed,
	]);

	useEffect(() => {
		if (
			!isLoggedIn ||
			!container ||
			!url ||
			!keystore ||
			!api ||
			!t ||
			credentialIssuer
		) {
			return;
		}
	
		const userHandleB64u = keystore.getUserHandleB64u();
	
		if (!userHandleB64u) {
			return;
		}
	
		// @todo: split into separate functions to accommodate interruptions by prompts
		// for PIN and confirmation of adding issuer to trusted issuers.
		const handleCredentialOffer = async () => {
			try {
				// Get the credential offer
				const offer = await credentialOfferFromUrl(url);

				if (!offer) {
					throw new Error('Failed to load credential offer from URL.');
				}

				const {
					credential_issuer: issuer,
					credential_configuration_ids: credentialOfferConfigurationIds,
					grants,
				} = offer;

				// Credential offer validation
				if (!grants) throw new Error('Grant is missing in credential offer.');
				if (!issuer) throw new Error('Missing credential issuer in credential offer.');
				if (!credentialOfferConfigurationIds) throw new Error('Missing credential offer configuration IDs in credential offer.');

				setCredentialIssuer(issuer);

				// Get trusted issuers
				const { data: trustedCredentialIssuers } = await api.getExternalEntity('/issuer/all', undefined, true);
				const trustedCredentialIssuer = trustedCredentialIssuers[issuer];

				if (!trustedCredentialIssuer) {
					// @todo: Prompt to add issuer to trusted issuers
				}

				// Get issuer configuration
				const issuerConfiguration = await getIssuerConfiguration(
					issuer.endsWith('/') ? issuer.slice(0, -1) : issuer,
					isOnline,
					true
				);

				const metadata = 'metadata' in issuerConfiguration
					? issuerConfiguration.metadata
					: issuerConfiguration;

				setCredentialEndpoint(metadata.credential_endpoint);

				// @todo: What if there are multiple configuration IDs?
				const selectedConfigurationId = credentialOfferConfigurationIds[0];
				const selectedConfiguration = metadata.credential_configurations_supported[selectedConfigurationId];

				if (!selectedConfiguration) {
					throw new Error('Credential configuration not found');
				}

				setCredentialConfiguration(selectedConfiguration);

				/** Authorization code flow */

				if (FIELD_AUTHORIZATION_CODE_GRANT_TYPE in grants) {
					// @todo: May not be needed
					if (!trustedCredentialIssuer) {
						throw new Error('Issuing a credential with authorization code flow only works with trusted issuers.');
					}

					// Get issuer state
					const issuer_state = grants.authorization_code?.issuer_state;

					// Get redirect URL
					const { url: redirectUrl } = await container.openID4VCIClients[issuer]
						.generateAuthorizationRequest(selectedConfigurationId, userHandleB64u, issuer_state);

					// Possibly redirect
					if (redirectUrl) {
						window.location.href = redirectUrl;
						return;
					}
				}

				/** Pre-authorized code flow  */

				if (FIELD_PRE_AUTHORIZED_CODE_GRANT_TYPE in grants) {
					const preAuthorizedCodeGrant = grants[FIELD_PRE_AUTHORIZED_CODE_GRANT_TYPE];
					const code = preAuthorizedCodeGrant[FIELD_PRE_AUTHORIZED_CODE];

					setPreAuthorizedCode(code);

					if ('tx_code' in preAuthorizedCodeGrant && preAuthorizedCodeGrant.tx_code.description === 'PIN') {
						setIsPinRequired(true);
						setPinLength(preAuthorizedCodeGrant.tx_code.length);
						setIsPinPopupOpen(true);
						return;
					}

					const { accessToken, cNonce } = await getToken(issuer, code);
					setAccessToken(accessToken);
					setNonce(cNonce);
				}
			} catch (error: unknown) {
				if (error instanceof Error) {
					console.log(error.message);
				}
				setShowMessage(true);
			}
		};

		handleCredentialOffer();
	}, [
		container,
		isLoggedIn,
		t,
		api,
		isOnline,
		keystore,
		url,
		credentialIssuer
	]);

	useEffect(() => {
		if (pin.length !== pinLength) {
			return;
		}
	}, [pinLength, pin]);

	return (
		<>
			{showMessage &&
				<MessagePopup
					type="error"
					message={{
						title: t('messagePopup.credentialOfferFailure.title'),
						description: t('messagePopup.credentialOfferFailure.description'),
					}}
					onClose={() => setShowMessage(false)}
				/>
			}
			<PinPopup
				isOpen={isPinPopupOpen}
				setIsOpen={setIsPinPopupOpen}
				inputsCount={pinLength}
				onSubmit={(pin) => {
					setPin(pin);
				}}
			/>
		</>
	);
};
