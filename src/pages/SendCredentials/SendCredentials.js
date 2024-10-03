import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import StatusContext from '../../context/StatusContext';
import SessionContext from '../../context/SessionContext';

import QRCodeScanner from '../../components/QRCodeScanner/QRCodeScanner'; // Replace with the actual import path
import RedirectPopup from '../../components/Popups/RedirectPopup';
import QRButton from '../../components/Buttons/QRButton';
import { H1 } from '../../components/Heading';
import Button from '../../components/Buttons/Button';


function highlightBestSequence(verifier, search) {
	if (typeof verifier !== 'string' || typeof search !== 'string') {
		return verifier;
	}

	const searchRegex = new RegExp(search, 'gi');
	const highlighted = verifier.replace(searchRegex, '<span class="font-bold text-primary dark:text-primary-light">$&</span>');

	return highlighted;
}

const Verifiers = () => {
	const { isOnline } = useContext(StatusContext);
	const { api } = useContext(SessionContext);
	const [searchQuery, setSearchQuery] = useState('');
	const [verifiers, setVerifiers] = useState([]);
	const [filteredVerifiers, setFilteredVerifiers] = useState([]);
	const [showRedirectPopup, setShowRedirectPopup] = useState(false);
	const [selectedVerifier, setSelectedVerifier] = useState(null);
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

	const handleVerifierClick = async (id) => {
		const clickedVerifier = verifiers.find((verifier) => verifier.id === id);
		if (clickedVerifier) {
			setSelectedVerifier(clickedVerifier);
			setShowRedirectPopup(true);
		}
	};

	const handleCancel = () => {
		setShowRedirectPopup(false);
		setSelectedVerifier(null);
	};

	const handleContinue = () => {
		setLoading(true);

		console.log('Continue with:', selectedVerifier);

		if (selectedVerifier) {
			window.location.href = selectedVerifier.url;
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
				<H1 heading={t('common.navItemSendCredentials')}>
					<QRButton openQRScanner={openQRScanner} isSmallScreen={isSmallScreen} />
				</H1>
				<p className="italic text-gray-700 dark:text-gray-300">{t('pageSendCredentials.description')}</p>

				<div className="my-4">
					<input
						type="text"
						placeholder={t('pageSendCredentials.searchPlaceholder')}
						className="border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:inputDarkModeOverride w-full px-3 py-2"
						value={searchQuery}
						onChange={handleSearch}
					/>
				</div>

				{filteredVerifiers.length === 0 ? (
					<p className="text-gray-700 mt-4">{t('pageSendCredentials.noFound')}</p>
				) : (
					<div
						className="max-h-screen-80 overflow-y-auto space-y-2"
						style={{ maxHeight: '80vh' }}
					>
						{filteredVerifiers.map((verifier) => (
							<Button
								key={verifier.id}
								variant="outline"
								additionalClassName="break-words w-full text-left"
								style={{ wordBreak: 'break-all' }}
								onClick={() => handleVerifierClick(verifier.id)}
								disabled={!isOnline}
								title={!isOnline ? t('common.offlineTitle') : ''}
							>
								<div dangerouslySetInnerHTML={{ __html: highlightBestSequence(verifier.name, searchQuery) }} />
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
					popupTitle={`${t('pageSendCredentials.popup.title')} ${selectedVerifier?.name}`}
					popupMessage={t('pageSendCredentials.popup.message', { verifierName: selectedVerifier?.name })}
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

export default Verifiers;
