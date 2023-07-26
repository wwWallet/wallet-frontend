import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

function useCheckURL(urlToCheck) {
  const isLoggedIn = Cookies.get('loggedIn');
  const [isValidURL, setIsValidURL] = useState(null);
  const walletBackendUrl = process.env.REACT_APP_WALLET_BACKEND_URL;

  useEffect(() => {
    if (urlToCheck && isLoggedIn && window.location.pathname === '*') {
      const payload = {
        authorization_response_url: urlToCheck,
      };

      const appToken = Cookies.get('appToken');

      axios.post(
        `${walletBackendUrl}/issuance/handle/authorization/response`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${appToken}`,
          },
        }
      )
        .then((response) => {
          console.log('response: ', response);
          setIsValidURL(response.data.success);
        })
        .catch((error) => {
          console.error('Error sending request to backend:', error);
          setIsValidURL(false);
        });
    }
  }, [urlToCheck, isLoggedIn, walletBackendUrl]); // Add the missing dependencies here

  return isValidURL;
}

export default useCheckURL;
