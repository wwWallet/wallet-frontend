import { useContext, useState } from 'react';
import ContainerContext from '../context/ContainerContext';
import SessionContext from '../context/SessionContext';
import { useTranslation } from 'react-i18next';
import MessagePopup from '../components/Popups/MessagePopup';
import { BackgroundTasksContext } from '../context/BackgroundTasksContext';

type CodeHandlerProps = {
	url: string;
};

export const CodeHandler = ({
	url,
}: CodeHandlerProps) => {
	const { t } = useTranslation();
	const container = useContext(ContainerContext);
	const { api, isLoggedIn, keystore } = useContext(SessionContext);
	const { addLoader, removeLoader } = useContext(BackgroundTasksContext);
	const [showMessage, setShowMessage] = useState(false);

	if (!isLoggedIn || !container || !url || !keystore || !api || !t) {
		return null;
	}

	const userHandleB64u = keystore.getUserHandleB64u();

	if (!userHandleB64u) {
		throw new Error("User handle could not be extracted from keystore");
	}

	const onClose = () => {
		setShowMessage(false);
		window.history.replaceState({}, '', `${window.location.pathname}`);
	};

	const handleCode = async () => {
		for (const credentialIssuerIdentifier of Object.keys(container.openID4VCIClients)) {
			addLoader();
			try {
				await container.openID4VCIClients[credentialIssuerIdentifier]
					.handleAuthorizationResponse(url, userHandleB64u)
			} catch (error) {
				console.log("Error during the handling of authorization response");
				console.error(error);
				removeLoader();
				setShowMessage(true);
			}
		}
	};

	handleCode();

	return (
		<>
			{showMessage &&
				<MessagePopup
					type="error"
					message={{
						title: t('messagePopup.codeFailure.title'),
						description: t('messagePopup.codeFailure.description'),
					}}
					onClose={onClose}
				/>
			}
		</>
	);
};
