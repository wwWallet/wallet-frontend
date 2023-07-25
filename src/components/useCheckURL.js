import { useEffect, useState } from 'react';
import axios from 'axios'; // Import axios
import Cookies from 'js-cookie';

function useCheckURL(urlToCheck) {
	const isLoggedIn = Cookies.get('loggedIn');
  const [isValidURL, setIsValidURL] = useState(null);
	const walletBackendUrl = process.env.REACT_APP_WALLET_BACKEND_URL;

	
  useEffect(() => {
    if (urlToCheck && isLoggedIn) 
			{

			const payload = {
				authorization_response_url: urlToCheck,
			};
			
			const appToken = Cookies.get('appToken'); // Retrieve the app token from cookies
      console.log('urlToCheck: ', urlToCheck);
      // Replace 'your_backend_endpoint' with the actual URL of your backend endpoint


			axios.post(`${walletBackendUrl}/issuance/handle/authorization/response`,
			payload,
			{ headers: 
				{ Authorization: `Bearer ${appToken}`,},
			}
			)
			.then((response) => {
				// Handle the response from the backend to determine the validity of the URL.
				console.log('response: ',response);
				setIsValidURL(response.data.success);
			})
			.catch((error) => {
						// Handle errors from the backend if needed
						console.error('Error sending request to backend:', error);
						setIsValidURL(false); // Set URL as invalid in case of an error
			});
		};

  }, [urlToCheck]);

  return isValidURL;
}

export default useCheckURL;
