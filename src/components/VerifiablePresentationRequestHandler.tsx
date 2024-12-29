import { useContext, useEffect, useState } from 'react';
import ContainerContext from '../context/ContainerContext';
import SessionContext from '../context/SessionContext';
import { useTranslation } from 'react-i18next';
import MessagePopup from '../components/Popups/MessagePopup';
import SelectCredentialPopup from '../components/Popups/SelectCredentialPopup.jsx';
import { useApi } from '../hooks/useApi';
import StatusContext from '../context/StatusContext';
import parseJwt from '../functions/ParseJwt';
import { VerifiableCredentialFormat } from '../lib/schemas/vc';
import { post } from '../lib/http/proxy-client';
import { generateRandomIdentifier } from '../lib/utils/generateRandomIdentifier';
import { requestFromUrl } from '../lib/services/verifiable-credential.service';

type VerifiablePresentationRequestHandlerProps = {
	url: string;
};

export const VerifiablePresentationRequestHandler = ({
	url,
}: VerifiablePresentationRequestHandlerProps) => {
	const { t } = useTranslation();
	const container = useContext(ContainerContext);
	const { isLoggedIn, keystore } = useContext(SessionContext);
	const { isOnline } = useContext(StatusContext);
	const api = useApi();
	const [showMessage, setShowMessage] = useState(false);
	const [showSelectCredential, setShowSelectCredential] = useState(false);
	const [selectableCredentials, setSelectableCredentials] = useState<any[]>([]);
	const [verifierDomainName, setVerifierDomainName] = useState('');
	const [credentialName, setCredentialName] = useState('');
	const [purpose, setPurpose] = useState('');
	const [selectedCredential, setSelectedCredential] = useState<any>(null);
	const [presentationDefinitionId, setPresentationDefinitionId] = useState('');
	const [state, setState] = useState('');
	const [nonce, setNonce] = useState('');
	const [responseUri, setResponseUri] = useState('');

	useEffect(() => {
		if (
			!isLoggedIn ||
			!container ||
			!url ||
			!keystore ||
			!api ||
			!t ||
			selectableCredentials.length > 0
		) {
			return;
		}
	
		const userHandleB64u = keystore.getUserHandleB64u();
	
		if (!userHandleB64u) {
			return;
		}
	
		const handleRequest = async () => {
			try {
				const request = await requestFromUrl(url);

				if (!request) {
					throw new Error('Failed to load verifiable presentation request from URL.');
				}

				// @todo: verify jwt
				const requestJwt = parseJwt(request);

				const {
					client_id: clientId,
					presentation_definition_uri: presentationDefinitionUri,
					response_uri: responseUri,
					state,
					nonce,
				} = requestJwt;

				const presentationDefinitionResponse = await fetch(presentationDefinitionUri);
				const presentationDefinitionJson = await presentationDefinitionResponse.json();

				setPresentationDefinitionId(presentationDefinitionJson.id);
				setState(state);
				setNonce(nonce);
				setResponseUri(responseUri);

				const {
					name,
					purpose,
					input_descriptors: inputDescriptors,
				} = presentationDefinitionJson;

				// @todo: handle multiple input descriptors
				const inputDescriptor = inputDescriptors[0];

				const { schema } = inputDescriptor;

				// @todo: handle more than one schema
				const verifiableCredentialType = schema[0].uri;

				const { data: { vc_list: vcList }} = await api.get('/storage/vc');

				const conformingVcList = [];
				for (const vc of vcList) {
					const parsedCredential = parseJwt(vc.credential);
					if (vc.format === VerifiableCredentialFormat.JWT_VC_JSON && parsedCredential.type.includes(verifiableCredentialType)) {
						conformingVcList.push(vc.credential);
					}
				}

				if (conformingVcList.length === 0) {
					throw new Error('No matching credentials to present.');
				}

				// @todo: select credential
				const verifierDomainName = clientId.includes("http") ? new URL(clientId).hostname : clientId;
				
				setCredentialName(name);
				setVerifierDomainName(verifierDomainName);
				setPurpose(purpose);
				setSelectableCredentials(vcList.filter(vc => conformingVcList.includes(vc.credential)));
				setShowSelectCredential(true);
			} catch (error: unknown) {
				if (error instanceof Error) {
					console.log(error.message);
				}
				setShowMessage(true);
			}
		};

		handleRequest();
	}, [
		container,
		isLoggedIn,
		t,
		api,
		isOnline,
		keystore,
		url,
		selectableCredentials,
	]);

	useEffect(() => {
		if (!selectedCredential) {
			return;
		}

		const submitPresentation = async () => {
			const { vpjwt: vpJwt } = await keystore.signJwtPresentation(nonce, verifierDomainName, [selectedCredential.credential])

			const presentationSubmission = {
				id: generateRandomIdentifier(8),
				definition_id: presentationDefinitionId,
				descriptor_map: [{
					"id":"ABC",
					"format":"jwt_vp",
					"path":"$",
					"path_nested":{
						"id":"ABC",
						"format":"jwt_vc",
						"path":"$.vp.verifiableCredential[0]"
					}
				}]
			,
			};

			const formData = new URLSearchParams();

			formData.append('expires_in', '300');
			formData.append('vp_token', vpJwt);
			formData.append('presentation_submission', JSON.stringify(presentationSubmission));
			formData.append('state', state);

			await post(responseUri, formData.toString(), {
				'Content-Type': 'application/x-www-form-urlencoded',
			});

			setShowSelectCredential(false);
		}

		submitPresentation();
	}, [
		selectedCredential,
		keystore,
		verifierDomainName,
		nonce,
		responseUri,
		state,
		presentationDefinitionId,
	]);

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
			{showSelectCredential &&
				<SelectCredentialPopup
					isOpen={showSelectCredential}
					setIsOpen={setShowSelectCredential}
					onCredentialSelect={setSelectedCredential}
					credentialName={credentialName}
					verifierDomainName={verifierDomainName}
					purpose={purpose}
					selectableCredentials={selectableCredentials}
				/>
			}
		</>
	);
};
