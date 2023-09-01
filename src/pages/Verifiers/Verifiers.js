import React, { useState, useEffect } from 'react';
import { FaShare } from 'react-icons/fa';

import * as api from '../../api';
import Layout from '../../components/Layout';
import Spinner from '../../components/Spinner';

function highlightBestSequence(verifier, search) {
  if (typeof verifier !== 'string' || typeof search !== 'string') {
    return verifier;
  }

  const searchRegex = new RegExp(search, 'gi');
  const highlighted = verifier.replace(searchRegex, '<span class="font-bold text-custom-blue">$&</span>');

  return highlighted;
}

const Verifiers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiers, setVerifiers] = useState([]);
  const [filteredVerifiers, setFilteredVerifiers] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedVerifier, setSelectedVerifier] = useState(null);
	const [selectedScope, setSelectedScope] = useState(null);

	const [loading, setLoading] = useState(false);

  useEffect(() => {

    const fetchVerifiers = async () => {
      try {
        const fetchedVerifiers = [
          {
            client_id: "",
            client_secret: "",
            did: "did:ebsi:dfsjhjhfdjhdfjdf",
            friendlyName: "Acme Corp",
            id: 1,
            url: "http://127.0.0.1:4445",
						scopes: [ { scope_name: "vid",  description: "Present your Verifiable ID" }, { scope_name: "ver",  description: "Random verification test" } ]

          },
					{
						client_id: "",
            client_secret: "",
            did: "did:ebsi:jkljklkjjkljk",
            friendlyName: "National Authority",
						id: 2, 
						name: "National Authority",
						url: "http://wallet-enterprise-vid-issuer:8003" ,
						scopes: [ { scope_name: "vid",  description: "Present your Verifiable ID" }, { scope_name: "ver",  description: "Random verification test" } ]
					}
        ];
        setVerifiers(fetchedVerifiers);
        setFilteredVerifiers(fetchedVerifiers);
      } catch (error) {
        console.error('Error fetching verifiers:', error);
      }
    };

    fetchVerifiers();
  }, []);

  const handleSearch = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
  };

  useEffect(() => {
    const filtered = verifiers.filter((verifier) => {
      const friendlyName = verifier.friendlyName.toLowerCase();
      const query = searchQuery.toLowerCase();
      return friendlyName.includes(query);
    });

		setFilteredVerifiers(filtered);
  }, [searchQuery, verifiers]);

	const handleVerifierClick = async (did) => {
		const clickedVerifier = verifiers.find((verifier) => verifier.did === did);
		if (clickedVerifier) {
			setSelectedScope(null); // Reset the selected scope
			setSelectedVerifier(clickedVerifier);
			setShowPopup(true);
		}
	};

  const handleCancel = () => {
    setShowPopup(false);
    setSelectedVerifier(null);
  };

	const handleContinue = () => {
		setLoading(true);
				
		console.log('Continue with:', selectedVerifier, 'and scope:', selectedScope);


		if (selectedVerifier && selectedVerifier.url) {

			const url = new URL("http://wallet-enterprise-vid-issuer:8003/verification/authorize");
			url.searchParams.append("scope", "")
			url.searchParams.append("redirect_uri", "");
			url.searchParams.append("client_id", "")
			url.searchParams.append("response_type", "")
			url.searchParams.append("state", "")
		
			const newTab = window.open(url.toString(), '_blank');
			if (newTab) {
				newTab.focus();
			}
		}
		
		setLoading(false);
		setShowPopup(false);
	};


  return (
    <Layout>
      <div className="px-4 sm:px-6">
        <h1 className="text-2xl mb-2 font-bold text-custom-blue">Verifiers</h1>
        <hr className="mb-2 border-t border-custom-blue/80" />
        <p className="italic text-gray-700">Search and choose a verifier for credential retrieval</p>

        <div className="my-4">
          <input
            type="text"
            placeholder="Search verifiers..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        {filteredVerifiers.length === 0 ? (
          <p className="text-gray-700 mt-4">No matching verifiers found.</p>
        ) : (
          <ul
            className="max-h-screen-80 overflow-y-auto space-y-2"
            style={{ maxHeight: '80vh' }}
          >
            {filteredVerifiers.map((verifier) => (
              <li
                key={verifier.id}
                className="bg-white px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 break-words"
                style={{ wordBreak: 'break-all' }}
                onClick={() => handleVerifierClick(verifier.did)}
              >
                <div dangerouslySetInnerHTML={{ __html: highlightBestSequence(verifier.friendlyName, searchQuery) }} />
              </li>
            ))}
          </ul>
        )}
      </div>


			
			{showPopup && (
				<div className="fixed inset-0 flex items-center justify-center z-50">
					<div className="absolute inset-0 bg-black opacity-50"></div>
					<div className="bg-white p-4 rounded-lg shadow-lg w-full lg:w-[33.33%] sm:w-[66.67%] z-10 relative m-4">
						{loading ? (
							<div className="flex items-center justify-center h-24">
 								<Spinner />
 							</div>
						) : (
							<>
								<h2 className="text-lg font-bold mb-2 text-custom-blue">
									<FaShare size={20} className="inline mr-1 mb-1" /> 
									Selected Verifier: {selectedVerifier?.friendlyName}
								</h2>
								<hr className="mb-2 border-t border-custom-blue/80" />
								<p className="mb-2 mt-4">
									You have selected {selectedVerifier?.friendlyName}. If you continue, you will be redirected in a new tab to the verifier's page.
								</p>

								<div className="mt-4">
									<label htmlFor="scopes" className="block text-sm font-medium text-gray-600">Select Scope</label>
									<select
										id="scopes"
										name="scopes"
										className="mt-1 p-2 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
										value={selectedScope}
										onChange={(e) => setSelectedScope(e.target.value)}
									>
										<option value="" disabled>Select a scope</option>
										{selectedVerifier?.scopes.map((scope, index) => (
											<option key={index} value={scope.scope_name}>{scope.description}</option>
										))}
									</select>
								</div>

								<div className="flex justify-end space-x-2 pt-4">
									<button className="px-4 py-2 text-gray-900 bg-gray-300 hover:bg-gray-400 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800" onClick={handleCancel}>
										Cancel
									</button>
									<button className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" onClick={handleContinue}>
										Continue
									</button>
								</div>
							</>
						)}
					</div>
				</div>
			)}

    </Layout>
  );
};

export default Verifiers;
