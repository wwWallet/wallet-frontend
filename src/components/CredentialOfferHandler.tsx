import { useContext, useState } from 'react';
import ContainerContext from '../context/ContainerContext';
import SessionContext from '../context/SessionContext';
import { useTranslation } from 'react-i18next';
import MessagePopup from '../components/Popups/MessagePopup';
import { credentialOfferFromUrl } from '../lib/services/credential-offer.service';
import { useApi } from '../hooks/useApi';
import { getDid, getIssuerConfiguration } from '../lib/services/credential-issuer.service';
import StatusContext from '../context/StatusContext';
import { FIELD_PRE_AUTHORIZED_CODE, FIELD_PRE_AUTHORIZED_CODE_GRANT_TYPE, FIELD_USER_PIN_REQUIRED, generateNonceProof, getCredential, getToken } from '../lib/services/pre-authorized-code-flow.service';
import { VerifiableCredentialFormat } from '../lib/schemas/vc';
import { generateRandomIdentifier } from '../lib/utils/generateRandomIdentifier';

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

	if (!isLoggedIn || !container || !url || !keystore || !api || !t) {
		return null;
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
				credential_issuer: credentialIssuer,
				credential_configuration_ids: credentialOfferConfigurationIds,
				grants,
			} = offer;

			// Credential offer validation
			if (!grants) throw new Error('Grant is missing in credential offer.');
			if (!credentialIssuer) throw new Error('Missing credential issuer in credential offer.');
			if (!credentialOfferConfigurationIds) throw new Error('Missing credential offer configuration IDs in credential offer.');

			// Get trusted issuers
			const { data: trustedCredentialIssuers } = await api.getExternalEntity('/issuer/all', undefined, true);
			const trustedCredentialIssuer = trustedCredentialIssuers[credentialIssuer];

			if (!trustedCredentialIssuer) {
				// @todo: Prompt to add issuer to trusted issuers
			}

			// Get issuer configuration
			const { metadata } = await getIssuerConfiguration(credentialIssuer, isOnline, true);

			// @todo: What if there are multiple configuration IDs?
			const selectedConfigurationId = credentialOfferConfigurationIds[0];
			const selectedConfiguration = metadata.credential_configurations_supported[selectedConfigurationId];

			if (!selectedConfiguration) {
				throw new Error('Credential configuration not found');
			}

			/** Authorization code flow */

			if ('authorization_code' in grants) {
				// @todo: May not be needed
				if (!trustedCredentialIssuer) {
					throw new Error('Issuing a credential with authorization code flow only works with trusted issuers.');
				}
				
				// Get issuer state
				const issuer_state = grants.authorization_code?.issuer_state;

				// Get redirect URL
				const { url: redirectUrl } = await container.openID4VCIClients[credentialIssuer]
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
				const preAuthorizedCode = preAuthorizedCodeGrant[FIELD_PRE_AUTHORIZED_CODE];
				
				if (preAuthorizedCodeGrant[FIELD_USER_PIN_REQUIRED]) {
					// @todo: Prompt for PIN
				}

				// Get token
				// @todo: Pass PIN if applicable
				const { accessToken, cNonce } = await getToken(credentialIssuer, preAuthorizedCode);

				// Generate proof
				const { jws } = await generateNonceProof(keystore, cNonce, credentialIssuer, 'wwWallet');

				// Get issuer did
				const did = await getDid(credentialIssuer);

				// Get credential
				const credential = await getCredential(
					metadata.credential_endpoint,
					accessToken,
					jws,
					VerifiableCredentialFormat.JWT_VC_JSON, // @todo: retrieve dynamically
					selectedConfiguration,
				);

				// Store credential
				await api.post('/storage/vc', {
					credentialConfigurationId: did.id,
					credentialIssuerIdentifier: credentialIssuer,
					credentialIdentifier: generateRandomIdentifier(32),
					credential: credential.credential,
					format: VerifiableCredentialFormat.JWT_VC_JSON, // @todo: retrieve dynamically
				});
			}
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.log(error.message);
			}
			setShowMessage(true);
		}
	};

	handleCredentialOffer();

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
		</>
	);
};
