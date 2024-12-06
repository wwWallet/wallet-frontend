import { useContext, useState } from 'react';
import ContainerContext from '../context/ContainerContext';
import SessionContext from '../context/SessionContext';
import { useTranslation } from 'react-i18next';
import MessagePopup from '../components/Popups/MessagePopup';

type CredentialOfferHandlerProps = {
	url: string;
};

export const CredentialOfferHandler = ({
	url,
}: CredentialOfferHandlerProps) => {
	const { t } = useTranslation();
	const container = useContext(ContainerContext);
	const { api, isLoggedIn, keystore } = useContext(SessionContext);
	const [showMessage, setShowMessage] = useState(false);

	if (!isLoggedIn || !container || !url || !keystore || !api || !t) {
		return null;
	}

	const userHandleB64u = keystore.getUserHandleB64u();

	if (!userHandleB64u) {
		return;
	}

	const parsedUrl = new URL(url);

	const handleCredentialOffer = async () => {
		for (const credentialIssuerIdentifier of Object.keys(container.openID4VCIClients)) {
			try {
				const {
					selectedCredentialConfigurationId,
					issuer_state,
				} = await container.openID4VCIClients[credentialIssuerIdentifier]
					.handleCredentialOffer(parsedUrl.toString(), userHandleB64u);
				const { url: redirectUrl } = await container.openID4VCIClients[credentialIssuerIdentifier]
					.generateAuthorizationRequest(selectedCredentialConfigurationId, userHandleB64u, issuer_state);
				if (redirectUrl) {
					window.location.href = redirectUrl;
					break;
				}
			} catch (error) {
				console.log(error);
			}
		}
		setShowMessage(true);
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
