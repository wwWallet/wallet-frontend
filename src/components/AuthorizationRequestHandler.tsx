import { useContext, useEffect, useState } from 'react';
import ContainerContext from '../context/ContainerContext';
import SessionContext from '../context/SessionContext';
import { useTranslation } from 'react-i18next';
import MessagePopup from '../components/Popups/MessagePopup';
import { HandleAuthorizationRequestError } from '../lib/interfaces/IOpenID4VPRelyingParty';
import SelectCredentialsPopup from '../components/Popups/SelectCredentialsPopup';

type AuthorizationRequestHandlerProps = {
	url: string;
};

export const AuthorizationRequestHandler = ({
	url,
}: AuthorizationRequestHandlerProps) => {
	const { t } = useTranslation();
	const container = useContext(ContainerContext);
	const { api, isLoggedIn, keystore } = useContext(SessionContext);
	const [showMessage, setShowMessage] = useState(false);
	const [messageTitle, setMessageTitle] = useState('');
	const [messageDescription, setMessageDescription] = useState('');
	const [showSelectCredentialsPopup, setShowSelectCredentialsPopup] = useState<boolean>(false);
	const [selectionMap, setSelectionMap] = useState<{ [x: string]: string } | null>(null);
	const [conformantCredentialsMap, setConformantCredentialsMap] = useState(null);
	const [verifierDomainName, setVerifierDomainName] = useState('');

	useEffect(() => {
		const sendAuthorizationResponse = async () => {
			try {
				const { url: redirectUrl } = await container.openID4VPRelyingParty
					.sendAuthorizationResponse(
						new Map(Object.entries(selectionMap)),
					);

				if (redirectUrl) {
					window.location.href = redirectUrl;
				}
			} catch (error) {
				console.error(error);
			}
		};

		if (!selectionMap) return;

		console.log('Selection map was mutated...');
		sendAuthorizationResponse();
	}, [selectionMap, container, keystore]);

	useEffect(() => {
		if (!isLoggedIn || !container || !url || !keystore || !api || !t) {
			return null;
		}

		const userHandleB64u = keystore.getUserHandleB64u();

		if (!userHandleB64u) {
			return;
		}

		const handleAuthorizationRequest = async () => {
			try {
				const result = await container.openID4VPRelyingParty.handleAuthorizationRequest(url);

				const { err } = result as unknown as { err: HandleAuthorizationRequestError };

				if (err !== undefined) {
					switch(err) {
						case HandleAuthorizationRequestError.INSUFFICIENT_CREDENTIALS:
							setMessageTitle('messagePopup.insufficientCredentials.title');
							setMessageDescription('messagePopup.insufficientCredentials.description');
							break;
						case HandleAuthorizationRequestError.NONTRUSTED_VERIFIER:
							setMessageTitle('messagePopup.nonTrustedVerifier.title');
							setMessageDescription('messagePopup.nonTrustedVerifier.description');
							break;
						default:
					}
					if (messageTitle) setShowMessage(true);
					return;
				}

				const {
					conformantCredentialsMap,
					verifierDomainName,
				} = result as unknown as {
					conformantCredentialsMap: Map<string, string[]>;
					verifierDomainName: string;
				};

				const jsonedMap = Object.fromEntries(conformantCredentialsMap);
				window.history.replaceState({}, '', `${window.location.pathname}`);
				setVerifierDomainName(verifierDomainName);
				setConformantCredentialsMap(jsonedMap);
				setShowSelectCredentialsPopup(true);

			} catch (error) {
				console.log("Failed to handle authorization req");
				console.error(error)
			}
		};

		handleAuthorizationRequest();
	}, [
		messageTitle,
		url,
		api,
		container,
		isLoggedIn,
		keystore,
		t,
	]);

	return (
		<>
			{showMessage &&
				<MessagePopup
					type="error"
					message={{
						title: t(messageTitle),
						description: t(messageDescription),
					}}
					onClose={() => setShowMessage(false)}
				/>
			}
			{showSelectCredentialsPopup &&
				<SelectCredentialsPopup
					isOpen={showSelectCredentialsPopup}
					setIsOpen={setShowSelectCredentialsPopup}
					setSelectionMap={setSelectionMap}
					conformantCredentialsMap={conformantCredentialsMap}
					verifierDomainName={verifierDomainName}
				/>
			}
		</>
	);
};
