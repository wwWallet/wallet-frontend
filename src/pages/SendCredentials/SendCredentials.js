import React, { useState, useEffect } from 'react';
import { FaShare } from 'react-icons/fa';
import {BsQrCodeScan} from 'react-icons/bs'
import { useApi } from '../../api';
import Layout from '../../components/Layout';
import Spinner from '../../components/Spinner';
import QRCodeScanner from '../../components/QRCodeScanner'; // Replace with the actual import path

function highlightBestSequence(verifier, search) {
  if (typeof verifier !== 'string' || typeof search !== 'string') {
    return verifier;
  }

  const searchRegex = new RegExp(search, 'gi');
  const highlighted = verifier.replace(searchRegex, '<span class="font-bold text-custom-blue">$&</span>');

  return highlighted;
}

const Verifiers = () => {
  const api = useApi();
  const [searchQuery, setSearchQuery] = useState('');
  const [verifiers, setVerifiers] = useState([]);
  const [filteredVerifiers, setFilteredVerifiers] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedVerifier, setSelectedVerifier] = useState(null);
	const [selectedScope, setSelectedScope] = useState(null);
  const [attemptedContinueWithoutScope, setAttemptedContinueWithoutScope] = useState(false);
	const [loading, setLoading] = useState(false);
	const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);

	useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {

    const fetchVerifiers = async () => {
      try {
				const fetchedVerifiers = await api.getAllVerifiers();
        setVerifiers(fetchedVerifiers);
        setFilteredVerifiers(fetchedVerifiers);
      } catch (error) {
        console.error('Error fetching verifiers:', error);
      }
    };

    fetchVerifiers();
  }, [api]);

  const handleSearch = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
  };

  useEffect(() => {
    const filtered = verifiers.filter((verifier) => {
      const name = verifier.name.toLowerCase();
      const query = searchQuery.toLowerCase();
      return name.includes(query);
    });

		setFilteredVerifiers(filtered);
  }, [searchQuery, verifiers]);

	const handleVerifierClick = async (did) => {
		const clickedVerifier = verifiers.find((verifier) => verifier.did === did);
		if (clickedVerifier) {
			window.location.href = clickedVerifier.url; // temporarily, just redirect to the verifier

			// setSelectedScope(null); // Reset the selected scope
			// setSelectedVerifier(clickedVerifier);
			// setShowPopup(true);
		}
	};

  const handleCancel = () => {
    setShowPopup(false);
    setSelectedVerifier(null);
  };

	const handleContinue = () => {
		setLoading(true);
		setAttemptedContinueWithoutScope(true); // Set the flag to true
		
		console.log('Continue with:', selectedVerifier, 'and scope:', selectedScope);

		if (!selectedScope) {
			setLoading(false);
			return; // Return early if no scope is selected
		}

		const { id } = selectedVerifier;
		api.initiatePresentationExchange(id, selectedScope)
			.then(({ redirect_to }) => {
				window.location.href = redirect_to;
			})
			.catch(e => {
				console.error(e);
			})
			.finally(() => {
				setLoading(false);
				setShowPopup(false);
				setAttemptedContinueWithoutScope(false); // Reset the flag
			});
	};

	// QR Code part
	const [isQRScannerOpen, setQRScannerOpen] = useState(false);

	const openQRScanner = () => {
		setQRScannerOpen(true);
	};

	const closeQRScanner = () => {
		setQRScannerOpen(false);
	};

  return (
    <Layout>
      <div className="sm:px-6 w-full">
				<div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-custom-blue">Send Credentials</h1>
          
					{ isSmallScreen && (
						<button
						className="px-2 py-2 mb-2 text-white bg-custom-blue hover:bg-custom-blue-hover focus:ring-4 focus:outline-none focus:ring-custom-blue font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-custom-blue-hover dark:hover:bg-custom-blue-hover dark:focus:ring-custom-blue-hover"
						onClick={openQRScanner} // Open the QR code scanner modal
					>
						<div className="flex items-center">
							<BsQrCodeScan size={20} className="text-white mr-2 sm:inline" />
							<span className="sm:inline">Scan</span>

						</div>
					</button>
					)}
          
        </div>
        <hr className="mb-2 border-t border-custom-blue/80" />
        <p className="italic text-gray-700">Search and choose a verifier to share credentials with</p>

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
                <div dangerouslySetInnerHTML={{ __html: highlightBestSequence(verifier.name, searchQuery) }} />
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
									Selected Verifier: {selectedVerifier?.name}
								</h2>
								<hr className="mb-2 border-t border-custom-blue/80" />
								{attemptedContinueWithoutScope && !selectedScope && (
									<p className="text-red-500 text-sm mt-1">Please select a scope before continuing.</p>
								)}
								<p className="mb-2 mt-4">
									You have selected {selectedVerifier?.name}. If you continue, you will be redirected in a new tab to the verifier's page.
								</p>

								<div className="mt-4">
									<label htmlFor="scopes" className="block text-sm font-medium text-gray-600">Select Scope</label>
									<select
										id="scopes"
										name="scopes"
										className="mt-1 p-2 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
										value={`${selectedScope ? selectedScope : ""}`}
										onChange={(e) => setSelectedScope(e.target.value)}
										required
									>  <option value="" hidden>Select a scope</option>
										{selectedVerifier?.scopes.map((scope, index) => (
											<option key={index} value={scope.name}>{scope.name}</option>
										))}
									</select>

								</div>

								<div className="flex justify-end space-x-2 pt-4">
									<button className="px-4 py-2 text-gray-900 bg-gray-300 hover:bg-gray-400 focus:ring-4 focus:outline-none focus:ring-gray-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center" onClick={handleCancel}>
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

			{/* QR Code Scanner Modal */}
			{isQRScannerOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
					<QRCodeScanner
						onClose={closeQRScanner}
					/>
				</div>
      )}
    </Layout>
  );
};

export default Verifiers;
