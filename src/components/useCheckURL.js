import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

function useCheckURL(urlToCheck) {
	const isLoggedIn = Cookies.get('loggedIn');
	const [isValidURL, setIsValidURL] = useState(null);
	const [showPopup, setShowPopup] = useState(false);
	const [selectedValue, setSelectedValue] = useState(null);
	const [conformantCredentialsMap, setConformantCredentialsMap] = useState(null);

	const walletBackendUrl = process.env.REACT_APP_WALLET_BACKEND_URL;
	const appToken = Cookies.get('appToken');

	useEffect(() => {

		async function handleAuthorizationRequest(url) {
			
			try {
				const response = await axios.post(
					walletBackendUrl + "/presentation/handle/authorization/request",
					{ authorization_request: url },
					{ headers: { "Authorization": `Bearer ${appToken}` } }
				);

				console.log("handleAuthorizationRequest:", response.data.redirect_to);

				if(response.statusText==="OK"){
					console.log(response.data);
					const { conformantCredentialsMap, verifierDomainName, redirect_to } = response.data;
					console.log(conformantCredentialsMap, verifierDomainName, redirect_to);
					if (redirect_to) {
						window.location.href = redirect_to; // Navigate to the redirect URL
					}else{
						console.log('need action');
						
						setConformantCredentialsMap(conformantCredentialsMap.VID);
						setShowPopup(true);

					}

					return true;
				}else{
					return false;
				}
			} catch (e) {
				console.log("Failed handleAuthorizationRequest:", e);
				return false;
			}

		};

		async function handleAuthorizationResponse(url) {
			try {
				const response = await axios.post(
					walletBackendUrl + "/issuance/handle/authorization/response",
					{ authorization_response_url: url },
					{ headers: { "Authorization": `Bearer ${appToken}` } }
				);
				console.log("handleAuthorizationResponse:", response);
				return true;

			} catch (e) {
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
	}, [urlToCheck, isLoggedIn, walletBackendUrl, appToken]);

	useEffect(() => {
		if (selectedValue) {
			console.log(selectedValue);

			axios.post(walletBackendUrl + "/presentation/generate/authorization/response",
			{ verifiable_credentials_map: {title: "VC Selection",selectedValue} },
			{ headers: { "Authorization": `Bearer ${appToken}` }}
		).then(success => {
			console.log(success);
			const { redirect_to } = success.data;
			window.location.href = redirect_to; // Navigate to the redirect URL

		}).catch(e => {
			console.error("Failed to generate authorization response")
			console.error(e.response.data);
		});

		}
	}, [selectedValue]);

	return { isValidURL, showPopup, setShowPopup, setSelectedValue, conformantCredentialsMap };
}

export default useCheckURL;
