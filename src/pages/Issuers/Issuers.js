import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Cookies from 'js-cookie';
import axios from 'axios';


function highlightBestSequence(issuer, search) {
  if (typeof issuer !== 'string' || typeof search !== 'string') {
    return issuer;
  }

  const searchRegex = new RegExp(search, 'gi');
  const highlighted = issuer.replace(searchRegex, '<span class="font-bold text-custom-blue">$&</span>');

  return highlighted;
}


const Issuers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [issuers, setIssuers] = useState([]);
  const [filteredIssuers, setFilteredIssuers] = useState([]);

	const walletBackendUrl = process.env.REACT_APP_WALLET_BACKEND_URL;

  useEffect(() => {
    const fetchIssuers = async () => {
			const appToken = Cookies.get('appToken'); // Retrieve the app token from cookies

      try {
        const response = await axios.get(`${walletBackendUrl}/legal_person/issuers/all`,
				{ headers: 
					{ Authorization: `Bearer ${appToken}`,},
				}
				);
        const fetchedIssuers = response.data;
        setIssuers(fetchedIssuers);
        setFilteredIssuers(fetchedIssuers);
      } catch (error) {
        console.error('Error fetching issuers:', error);
      }
    };

    fetchIssuers();
  }, []);

  const handleSearch = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
  };

  useEffect(() => {
    const filtered = issuers.filter((issuer) => {
      const friendlyName = issuer.friendlyName.toLowerCase();
      const query = searchQuery.toLowerCase();
      return friendlyName.includes(query);
    });

    const hasSearchResults = filtered.length > 0;
    const filteredWithCustom = hasSearchResults ? filtered : issuers;

    setFilteredIssuers(filteredWithCustom);
  }, [searchQuery, issuers]);

	const handleIssuerClick = (did) => {

		const payload = {
			legal_person_did: did,
		};
	
		const appToken = Cookies.get('appToken'); // Retrieve the app token from cookies
		console.log(appToken);
		axios.post(`${walletBackendUrl}/issuance/generate/authorization/request`,
				payload,
				{ headers: 
					{ Authorization: `Bearer ${appToken}`,},
				}
			)
			.then((response) => {

				const { redirect_to } = response.data;
				console.log(redirect_to);

				// Redirect to the URL received from the backend
				// window.location.href = redirect_to;
			})
			.catch((error) => {
				// Handle errors from the backend if needed
				console.error('Error sending request to backend:', error);
			});
		};


		return (
			<Layout>
				<div className="px-4 sm:px-6">
					<h1 className="text-2xl mb-2 font-bold text-custom-blue">Issuers</h1>
					<hr className="mb-2 border-t border-custom-blue/80" />
					<p className="italic text-gray-700">Search and choose an issuer for credential retrieval</p>
	
					<div className="my-4">
						<input
							type="text"
							placeholder="Search issuers..."
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							value={searchQuery}
							onChange={handleSearch}
						/>
					</div>
					<ul
						className="max-h-screen-80 overflow-y-auto space-y-2"
						style={{ maxHeight: '80vh' }}
					>
						{filteredIssuers.map((issuer) => (
							<li
								key={issuer.id}
								className="bg-white px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 break-words"
								style={{ wordBreak: 'break-all' }}
								onClick={() => handleIssuerClick(issuer.did)}
							>
								<div dangerouslySetInnerHTML={{ __html: highlightBestSequence(issuer.friendlyName, searchQuery) }} />
							</li>
						))}
					</ul>
				</div>
			</Layout>
		);
	};
	
	export default Issuers;