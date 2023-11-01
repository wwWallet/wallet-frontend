import { useEffect, useState, Dispatch, SetStateAction } from 'react';
import * as api from '../api';
import { useLocalStorageKeystore } from '../services/LocalStorageKeystore';


function useCheckURL(urlToCheck: string): {
	isValidURL: boolean | null,
	showPopup: boolean,
	setShowPopup: Dispatch<SetStateAction<boolean>>,
	setSelectedValue: Dispatch<SetStateAction<string | null>>,
	conformantCredentialsMap: any,
} {
	const isLoggedIn: boolean = api.isLoggedIn();
	const [isValidURL, setIsValidURL] = useState<boolean | null>(null);
	const [showPopup, setShowPopup] = useState<boolean>(false);
	const [selectedValue, setSelectedValue] = useState<string | null>(null);
	const [conformantCredentialsMap, setConformantCredentialsMap] = useState(null);
	const keystore = useLocalStorageKeystore();

	useEffect(() => {

		async function handleAuthorizationRequest(url: string): Promise<boolean> {
			console.log("handleAuthorizationRequest begin:", url);

			function finish({ conformantCredentialsMap, verifierDomainName, redirect_to }) {
				console.log(conformantCredentialsMap, verifierDomainName, redirect_to);
				if (redirect_to) {
					window.location.href = redirect_to; // Navigate to the redirect URL
				} else {
					console.log('need action');
					const firstValue = Object.values(conformantCredentialsMap)[0];
					setConformantCredentialsMap(firstValue);
					setShowPopup(true);
				}

				return true;
			}

			try {
				const response = await api.post(
					"/presentation/handle/authorization/request",
					{ authorization_request: url },
				);

				console.log("handleAuthorizationRequest:", response.data.redirect_to);

				if(response.statusText==="OK"){
					console.log(response.data);
					return finish(response.data);

				} else {
					return false;
				}

			} catch (e) {
				return false;
			}
		};

		async function handleAuthorizationResponse(url: string): Promise<boolean> {
			try {
				const response = await api.post(
					"/issuance/handle/authorization/response",
					{ authorization_response_url: url },
				);
				console.log("handleAuthorizationResponse:", response);
				return true;

			} catch (e) {
				if (e.response.status === 404) {
					return true;

				} else if (e.response.status === 409) {
					console.log("Signature request:", e.response.data);
					const { audience, nonce } = e.response.data;

					try {
						const { proof_jwt } = await keystore.generateOpenid4vciProof(audience, nonce);

						const response = await api.post(
							"/issuance/handle/authorization/response",
							{ authorization_response_url: url, proof_jwt },
						);
						console.log("handleAuthorizationResponse 2:", response);
						return true;

					} catch (e) {
						console.log("Failed to create Openid4vci proof:", e);
						return false;

					}
				}

				console.log("Failed handleAuthorizationResponse:", e);
				return false;
			}
		}

		if (urlToCheck && isLoggedIn && window.location.pathname==="/cb") {
			(async () => {
				const isRequestHandled = await handleAuthorizationRequest(urlToCheck);
				const isResponseHandled = await handleAuthorizationResponse(urlToCheck);

				if (isRequestHandled || isResponseHandled) {
					setIsValidURL(true);
				} else {
					setIsValidURL(false);
				}
			})();
		}
	}, [keystore, urlToCheck, isLoggedIn]);

	useEffect(() => {
		if (selectedValue) {
			console.log(selectedValue);

			api.post("/presentation/generate/authorization/response",
				{ verifiable_credentials_map: { title: "VC Selection", selectedValue } },
			).then(success => {
				console.log(success);
				const { redirect_to } = success.data;
				window.location.href = redirect_to; // Navigate to the redirect URL

			}).catch(async e => {
				if (e.response.status === 409) {
					console.log("Signature request:", e.response.data);

					const { nonce, audience, verifiableCredentials } = e.response.data;
					try {
						const { vpjwt } = await keystore.signJwtPresentation(nonce, audience, verifiableCredentials);
						api.post("/presentation/generate/authorization/response", {
							verifiable_credentials_map: { title: "VC Selection", selectedValue },
							vpjwt,
						}).then(success => {
							console.log(success);
							const { redirect_to } = success.data;
							window.location.href = redirect_to; // Navigate to the redirect URL

						}).catch(e => {
							console.error("Failed to generate authorization response")
							console.error(e.response.data);
						});

					} catch (e) {
						console.error("Failed to sign JWT presentation", e);
						throw e;
					}

				} else {

					console.error("Failed to generate authorization response")
					console.error(e.response.data);
				}
			});
		}
	}, [keystore, selectedValue]);

	return { isValidURL, showPopup, setShowPopup, setSelectedValue, conformantCredentialsMap };
}

export default useCheckURL;
