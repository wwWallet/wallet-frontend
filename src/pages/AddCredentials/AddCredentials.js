import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import StatusContext from '../../context/StatusContext';
import SessionContext from '../../context/SessionContext';

import QRCodeScanner from '../../components/QRCodeScanner/QRCodeScanner';
import RedirectPopup from '../../components/Popups/RedirectPopup';
import QRButton from '../../components/Buttons/QRButton';
import { H1 } from '../../components/Heading';
import Button from '../../components/Buttons/Button';


function highlightBestSequence(issuer, search) {
	if (typeof issuer !== 'string' || typeof search !== 'string') {
		return issuer;
	}

	const searchRegex = new RegExp(search, 'gi');
	const highlighted = issuer.replace(searchRegex, '<span class="font-bold text-primary dark:text-primary-light">$&</span>');

	return highlighted;
}

const Issuers = () => {
	const { isOnline } = useContext(StatusContext);
	const { api } = useContext(SessionContext);
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
				const response = await api.getExternalEntity('/legal_person/issuers/all');
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
				<H1 heading={t('common.navItemAddCredentials')}>
					<QRButton openQRScanner={openQRScanner} isSmallScreen={isSmallScreen} />
				</H1>
				<p className="italic text-gray-700 dark:text-gray-300">{t('pageAddCredentials.description')}</p>

				<div className="my-4">
					<input
						type="text"
						placeholder={t('pageAddCredentials.searchPlaceholder')}
						className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:inputDarkModeOverride"
						value={searchQuery}
						onChange={handleSearch}
					/>
				</div>
				{filteredIssuers.length === 0 ? (
					<p className="text-gray-700 dark:text-gray-300 mt-4">{t('pageAddCredentials.noFound')}</p>
				) : (
					<div
						className="max-h-screen-80 overflow-y-auto space-y-2"
						style={{ maxHeight: '80vh' }}
					>
						{filteredIssuers.map((issuer) => (
							<Button
								variant="outline"
								additionalClassName="break-words w-full text-left"
								key={issuer.id}
								style={{ wordBreak: 'break-all' }}
								onClick={() => handleIssuerClick(issuer.did)}
								disabled={!isOnline}
								title={!isOnline ? t('common.offlineTitle') : ''}
							>
								<div dangerouslySetInnerHTML={{ __html: highlightBestSequence(issuer.friendlyName, searchQuery) }} />
							</Button>
						))}
					</div>
				)}
			</div>

			{showRedirectPopup && (
				<RedirectPopup
					loading={loading}
					handleClose={handleCancel}
					handleContinue={handleContinue}
					popupTitle={`${t('pageAddCredentials.popup.title')} ${selectedIssuer?.friendlyName}`}
					popupMessage={t('pageAddCredentials.popup.message', { issuerName: selectedIssuer?.friendlyName })}
				/>
			)}

			{/* QR Code Scanner Modal */}
			{isQRScannerOpen && (
				<QRCodeScanner
					onClose={closeQRScanner}
				/>
			)}

		</>
	);
};

export default Issuers;
