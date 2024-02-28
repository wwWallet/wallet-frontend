import React, { useState, useEffect } from 'react';
import { BsQrCodeScan } from 'react-icons/bs'
import { useTranslation } from 'react-i18next';

import QRCodeScanner from '../../components/QRCodeScanner/QRCodeScanner';
import RedirectPopup from '../../components/Popups/RedirectPopup';
import { useApi } from '../../api';

function highlightBestSequence(issuer, search) {
	if (typeof issuer !== 'string' || typeof search !== 'string') {
		return issuer;
	}

	const searchRegex = new RegExp(search, 'gi');
	const highlighted = issuer.replace(searchRegex, '<span class="font-bold text-custom-blue">$&</span>');

	return highlighted;
}

const Issuers = () => {
	const api = useApi();
	const [searchQuery, setSearchQuery] = useState('');
	const [issuers, setIssuers] = useState([]);
	const [filteredIssuers, setFilteredIssuers] = useState([]);
	const [showRedirectPopup, setShowRedirectPopup] = useState(false);
	const [selectedIssuer, setSelectedIssuer] = useState(null);
	const [loading, setLoading] = useState(false);
	const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);

	const { t } = useTranslation();

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
		const fetchIssuers = async () => {
			try {
				const response = await api.get('/legal_person/issuers/all');
				const fetchedIssuers = response.data;
				setIssuers(fetchedIssuers);
				setFilteredIssuers(fetchedIssuers);
			} catch (error) {
				console.error('Error fetching issuers:', error);
			}
		};

		fetchIssuers();
	}, [api]);

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

		setFilteredIssuers(filtered);
	}, [searchQuery, issuers]);

	const handleIssuerClick = async (did) => {
		const clickedIssuer = issuers.find((issuer) => issuer.did === did);
		if (clickedIssuer) {
			setSelectedIssuer(clickedIssuer);
			setShowRedirectPopup(true);
		}
	};

	const handleCancel = () => {
		setShowRedirectPopup(false);
		setSelectedIssuer(null);
	};

	const handleContinue = () => {
		setLoading(true);

		console.log('Continue with:', selectedIssuer);

		if (selectedIssuer && selectedIssuer.did) {
			const payload = {
				legal_person_did: selectedIssuer.did,
			};

			api.post('/communication/handle', payload)
				.then((response) => {
					const { redirect_to } = response.data;
					console.log(redirect_to);

					// Redirect to the URL received from the backend
					window.location.href = redirect_to;
				})
				.catch((error) => {
					// Handle errors from the backend if needed
					console.error('Error sending request to backend:', error);
				});
		}

		setLoading(false);
		setShowRedirectPopup(false);
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
		<>
			<div className="sm:px-6 w-full">
				<div className="flex justify-between items-center">
					<h1 className="text-2xl font-bold text-custom-blue">{t('common.navItemAddCredentials')}</h1>
					{isSmallScreen && (
						<button
							className="px-2 py-2 mb-2 text-white bg-custom-blue hover:bg-custom-blue-hover focus:ring-4 focus:outline-none focus:ring-custom-blue font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-custom-blue-hover dark:hover:bg-custom-blue-hover dark:focus:ring-custom-blue-hover"
							onClick={openQRScanner} // Open the QR code scanner modal
						>
							<div className="flex items-center">
								<BsQrCodeScan size={20} className="text-white" />
							</div>
						</button>
					)}

				</div>
				<hr className="mb-2 border-t border-custom-blue/80" />
				<p className="italic text-gray-700">{t('pageAddCredentials.description')}</p>

				<div className="my-4">
					<input
						type="text"
						placeholder={t('pageAddCredentials.searchPlaceholder')}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						value={searchQuery}
						onChange={handleSearch}
					/>
				</div>
				{filteredIssuers.length === 0 ? (
					<p className="text-gray-700 mt-4">{t('pageAddCredentials.noFound')}</p>
				) : (
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
				)}
			</div>

			{showRedirectPopup && (
				<RedirectPopup
					loading={loading}
					handleClose={handleCancel}
					handleContinue={handleContinue}
					popupTitle={`${t('pageAddCredentials.popup.title')} ${selectedIssuer?.friendlyName}`}
					popupMessage={`${t('pageAddCredentials.popup.messagePart1')} ${selectedIssuer?.friendlyName}${t('pageAddCredentials.popup.messagePart2')}`}
				/>
			)}

			{/* QR Code Scanner Modal */}
			{isQRScannerOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
					<QRCodeScanner
						onClose={closeQRScanner}
					/>
				</div>
			)}

		</>
	);
};

export default Issuers;
