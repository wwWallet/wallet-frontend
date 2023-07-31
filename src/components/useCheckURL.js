import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

function useCheckURL(urlToCheck) {
  const isLoggedIn = Cookies.get('loggedIn');
  const [isValidURL, setIsValidURL] = useState(null);
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
					window.location.href = response.data.redirect_to; // Navigate to the redirect URL
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
				
				window.location.href = "/"; // Navigate to the redirect URL
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

  return isValidURL;
}

export default useCheckURL;
