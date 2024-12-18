import { useContext, useEffect, useState } from 'react';
import ContainerContext from '../context/ContainerContext';
import SessionContext from '../context/SessionContext';
import { useTranslation } from 'react-i18next';
import MessagePopup from '../components/Popups/MessagePopup';
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
	const [credentialIssuer, setCredentialIssuer] = useState('');

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
	
		const handleRequest = async () => {
			try {
				// Get the credential offer
				const request = await requestFromUrl(url);

				if (!request) {
					throw new Error('Failed to load verifiable presentation request from URL.');
				}

				// const request = 'eyJhbGciOiJFUzI1NksiLCJraWQiOnsia2lkIjoiMDQwMzkzOWJmMWEzMmY3MmUwOTZjYzdlZDJlOWFkMjNjZTZmM2MwZjZiOWQ4ZWUxY2I5ZmRiNDllMTdhNzIwZDIwMTEwMDE2ZjgzZWNkYTBlYjUyMDM1ZmRjZDQ3YzM5NzhlMmZiNTkyOTc5ZjgxNmNkNWEyYWU0OTcxZjM1ZmEwYyIsInR5cGUiOiJTZWNwMjU2azEiLCJrbXMiOiJsb2NhbCIsInB1YmxpY0tleUhleCI6IjAyMDM5MzliZjFhMzJmNzJlMDk2Y2M3ZWQyZTlhZDIzY2U2ZjNjMGY2YjlkOGVlMWNiOWZkYjQ5ZTE3YTcyMGQyMCIsIm1ldGEiOnsiYWxnb3JpdGhtcyI6WyJFUzI1NksiLCJFUzI1NkstUiIsImV0aF9zaWduVHJhbnNhY3Rpb24iLCJldGhfc2lnblR5cGVkRGF0YSIsImV0aF9zaWduTWVzc2FnZSIsImV0aF9yYXdTaWduIl0sImV0aGVyZXVtQWRkcmVzcyI6IjB4ZTA5M0NkMTA0ZDIyQUM1OTczODczMTQ3QUJiM2I3ZTc4NjM1YTdlMiIsInZlcmlmaWNhdGlvbk1ldGhvZCI6eyJpZCI6ImRpZDprZXk6elEzc2hNZWtYVHY0M1lqY0NFUDFHdnBqWVVwUVJYR3BiQkRIcXFCOHJZcEVWOXhjUCN6UTNzaE1la1hUdjQzWWpjQ0VQMUd2cGpZVXBRUlhHcGJCREhxcUI4cllwRVY5eGNQIiwidHlwZSI6IlNlY3AyNTZrMVZlcmlmaWNhdGlvbktleTIwMTgiLCJjb250cm9sbGVyIjoiZGlkOmtleTp6UTNzaE1la1hUdjQzWWpjQ0VQMUd2cGpZVXBRUlhHcGJCREhxcUI4cllwRVY5eGNQIiwicHVibGljS2V5SGV4IjoiMDIwMzkzOWJmMWEzMmY3MmUwOTZjYzdlZDJlOWFkMjNjZTZmM2MwZjZiOWQ4ZWUxY2I5ZmRiNDllMTdhNzIwZDIwIn19fSwidHlwIjoiSldUIn0.eyJpYXQiOjE3MzQwMjMxOTUsImV4cCI6MTczNDAyMzc5NSwic2NvcGUiOiJvcGVuaWQiLCJyZXNwb25zZV90eXBlIjoidnBfdG9rZW4iLCJjbGllbnRfaWQiOiJodHRwczovL3ZlcmlmaWVyLmRldi5lZHV3YWxsZXQubmwvZGVtb3ZwL3Jlc3BvbnNlLzIxOWQ1NzQ5LTQ5NTEtNDhiMy05OTk1LTRmNjU2YjQ3ZWE5MyIsInJlc3BvbnNlX3VyaSI6Imh0dHBzOi8vdmVyaWZpZXIuZGV2LmVkdXdhbGxldC5ubC9kZW1vdnAvcmVzcG9uc2UvMjE5ZDU3NDktNDk1MS00OGIzLTk5OTUtNGY2NTZiNDdlYTkzIiwibm9uY2UiOiI0YWMyOWRiOC1jMWUzLTQwYTQtODhmNy00ZGU1YTRjMjlhNmQiLCJzdGF0ZSI6IjIxOWQ1NzQ5LTQ5NTEtNDhiMy05OTk1LTRmNjU2YjQ3ZWE5MyIsInJlc3BvbnNlX21vZGUiOiJkaXJlY3RfcG9zdCIsImNsaWVudF9tZXRhZGF0YSI6eyJpZF90b2tlbl9zaWduaW5nX2FsZ192YWx1ZXNfc3VwcG9ydGVkIjpbIkVkRFNBIiwiRVMyNTYiLCJFUzI1NksiXSwicmVxdWVzdF9vYmplY3Rfc2lnbmluZ19hbGdfdmFsdWVzX3N1cHBvcnRlZCI6WyJFZERTQSIsIkVTMjU2IiwiRVMyNTZLIl0sInJlc3BvbnNlX3R5cGVzX3N1cHBvcnRlZCI6WyJ2cF90b2tlbiJdLCJzY29wZXNfc3VwcG9ydGVkIjpbIm9wZW5pZCJdLCJzdWJqZWN0X3R5cGVzX3N1cHBvcnRlZCI6WyJwYWlyd2lzZSJdLCJzdWJqZWN0X3N5bnRheF90eXBlc19zdXBwb3J0ZWQiOlsiZGlkOndlYiIsImRpZDpqd2siLCJkaWQ6a2V5IiwiZGlkOmlvbiJdLCJ2cF9mb3JtYXRzIjp7Imp3dF92YyI6eyJhbGciOlsiRWREU0EiLCJFUzI1NiIsIkVTMjU2SyJdfSwiand0X3ZwIjp7ImFsZyI6WyJFZERTQSIsIkVTMjU2IiwiRVMyNTZLIl19fX0sInByZXNlbnRhdGlvbl9kZWZpbml0aW9uX3VyaSI6Imh0dHBzOi8vdmVyaWZpZXIuZGV2LmVkdXdhbGxldC5ubC9kZW1vdnAvZ2V0LXByZXNlbnRhdGlvbi9BQkMiLCJpc3MiOiJkaWQ6a2V5OnpRM3NoTWVrWFR2NDNZamNDRVAxR3ZwallVcFFSWEdwYkJESHFxQjhyWXBFVjl4Y1AifQ.xg5KH-L6xbfWhIWOzCnFWnNS7Rp8XvOCmq0JWay8khR6PIZQhaBuJ5hScWwjQx6qMGXCHHOPh5a8W7xh38thjg';

				console.log(request);

				// @todo: verify jwt
				const requestJwt = parseJwt(request);

				console.log(requestJwt)
				
				const {
					client_id: clientId,
					presentation_definition_uri: presentationDefinitionUri,
					response_uri: responseUri,
					state,
					nonce,
				} = requestJwt;

				const presentationDefinitionResponse = await fetch(presentationDefinitionUri);
				const presentationDefinitionJson = await presentationDefinitionResponse.json();

				const { input_descriptors: inputDescriptors } = presentationDefinitionJson;

				// @todo: handle multiple input descriptors
				const inputDescriptor = inputDescriptors[0];

				const {
					constraints,
					schema,
				} = inputDescriptor;

				// @todo: handle more than one schema
				const verifiableCredentialType = schema[0].uri;

				console.log(verifiableCredentialType);
				console.log(constraints);

				const { data: { vc_list: vcList }} = await api.get('/storage/vc');
				console.log(vcList);

				const mapping = new Map<string, { credentials: string[], requestedFields: string[] }>();
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



				console.log(mapping);
				console.log(verifierDomainName);

				const { vpjwt: vpJwt } = await keystore.signJwtPresentation(nonce, verifierDomainName, [conformingVcList[0]])

				const presentationSubmission = {
					id: generateRandomIdentifier(8),
					definition_id: presentationDefinitionJson.id,
					descriptor_map: mapping,
				};
				const formData = new URLSearchParams();

				formData.append('expires_in', '300');
				formData.append('vp_token', vpJwt);
				formData.append('presentation_submission', JSON.stringify(presentationSubmission));
				formData.append('state', state);

				const res = await post(responseUri, formData.toString(), {
					'Content-Type': 'application/x-www-form-urlencoded',
				});
		
				console.log("Direct post response = ", JSON.stringify(res));
				
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
		credentialIssuer
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
		</>
	);
};
