import React, { useState, useEffect } from 'react';

import * as api from '../../api';
import Layout from '../../components/Layout';


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

  // State for showing the popup
  const [showPopup, setShowPopup] = useState(false);
  // State for storing the clicked verifier data
  const [selectedVerifier, setSelectedVerifier] = useState(null);

	useEffect(() => {
		const fetchVerifiers = async () => {
			try {
				// const response = await api.get('/legal_person/verifiers/all');
				// const fetchedVerifiers = response.data;

				const fetchedVerifiers = [
					{
						client_id: "",
						client_secret: "",
						did: "did:ebsi:dfsjhjhfdjhdfjdf",
						friendlyName: "Acme Corp",
						id: 1,
						url: "http://127.0.0.1:4445"
					},
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

		const hasSearchResults = filtered.length > 0;
		const filteredWithCustom = hasSearchResults ? filtered : verifiers;

		setFilteredVerifiers(filteredWithCustom);
	}, [searchQuery, verifiers]);

  const handleVerifierClick = (did) => {
    const clickedVerifier = verifiers.find(verifier => verifier.did === did);
    if (clickedVerifier) {
      setSelectedVerifier(clickedVerifier);
      setShowPopup(true);
    }
  };

  const handleCancel = () => {
    setShowPopup(false);
    setSelectedVerifier(null);
  };


	const handleContinue = () => {
		console.log('Continue with:', selectedVerifier);
		
		// Redirect to the verifier's URL in a new tab
		if (selectedVerifier && selectedVerifier.url) {
			window.open(selectedVerifier.url, '_blank');
		}
		
		setShowPopup(false);
	};
	
		return (
			<Layout>
				<div className="px-4 sm:px-6">
					<h1 className="text-2xl mb-2 font-bold text-custom-blue">Verifiers</h1>
					<hr className="mb-2 border-t border-custom-blue/80" />
					<p className="italic text-gray-700">Search and choose an verifier for credential retrieval</p>

					<div className="my-4">
						<input
							type="text"
							placeholder="Search verifiers..."
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							value={searchQuery}
							onChange={handleSearch}
						/>
					</div>
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
				</div>

				{/* Popup */}
				{showPopup && (
					<div className="fixed inset-0 flex items-center justify-center z-50">
						{/* Dark overlay */}
						<div className="absolute inset-0 bg-black opacity-50"></div>

						{/* Popup */}
						<div className="bg-white p-4 rounded-lg shadow-lg w-1/3 z-10 relative">
							<h2 className="text-lg font-bold mb-2">Selected Verifier</h2>
							<p className="mb-2">
								You have selected the {selectedVerifier?.friendlyName}, and if you continue you will be redirected in a new tab to the verifier's page.
							</p>
							<div className="flex justify-end space-x-2">
								<button className="px-4 py-2 bg-gray-300 rounded" onClick={handleCancel}>
									Cancel
								</button>
								<button className="px-4 py-2 bg-custom-blue text-white rounded" onClick={handleContinue}>
									Continue
								</button>
							</div>
						</div>
					</div>
				)}

			</Layout>
		);
	};

	export default Verifiers;