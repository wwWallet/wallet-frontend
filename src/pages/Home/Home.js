// External libraries
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Contexts
import SessionContext from '../../context/SessionContext';
import CredentialsContext from '../../context/CredentialsContext';

// Hooks
import useFetchPresentations from '../../hooks/useFetchPresentations';
import { useQRScanner } from '../../hooks/useQRScanner';
import useScreenType from '../../hooks/useScreenType';

// Components
import { H1 } from '../../components/Shared/Heading';
import QRCodeScanner from '../../components/QRCodeScanner/QRCodeScanner';
import CredentialImage from '../../components/Credentials/CredentialImage';
import QRButton from '../../components/Buttons/QRButton';
import AddCredentialCard from '../../components/Credentials/AddCredentialCard';
import HistoryList from '../../components/History/HistoryList';
import Slider from '../../components/Shared/Slider';

const Home = () => {
	const { vcEntityList, latestCredentials, getData } = useContext(CredentialsContext);
	const { isQRScannerOpen, openQRScanner, closeQRScanner } = useQRScanner();
	const { api } = useContext(SessionContext);
	const history = useFetchPresentations(api);
	const [currentSlide, setCurrentSlide] = useState(1);
	const screenType = useScreenType();

	const navigate = useNavigate();
	const { t } = useTranslation();

	useEffect(() => {
		getData();
	}, [getData]);

	const handleAddCredential = () => {
		navigate('/add');
	};

	const handleImageClick = (vcEntity) => {
		navigate(`/credential/${vcEntity.credentialIdentifier}`);
	};

	const renderSlideContent = (vcEntity) => (
		<button
			key={vcEntity.id}
			className={`relative rounded-xl w-full overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer ${latestCredentials.has(vcEntity.id) ? 'fade-in' : ''}`}
			onClick={() => handleImageClick(vcEntity)}
			aria-label={`${vcEntity.friendlyName}`}
			tabIndex={currentSlide !== vcEntityList.indexOf(vcEntity) + 1 ? -1 : 0}
			title={t('pageCredentials.credentialFullScreenTitle', { friendlyName: vcEntity.friendlyName })}
		>
			<CredentialImage credential={vcEntity.credential} className={`w-full h-full rounded-xl ${latestCredentials.has(vcEntity.id) ? 'highlight-filter' : ''}`} />
		</button>
	);

	return (
		<>
			<div className="sm:px-6 w-full">
				<H1 heading={t('common.navItemCredentials')}>
					<QRButton openQRScanner={openQRScanner} />
				</H1>
				{screenType !== 'mobile' && (
					<p className="italic pd-2 text-gray-700 dark:text-gray-300">{t('pageCredentials.description')}</p>
				)}
				<div className='my-4 p-2'>
					{vcEntityList.length === 0 ? (
						<div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20">
							<AddCredentialCard onClick={handleAddCredential} />
						</div>
					) : (
						<>
							{screenType !== 'desktop' ? (
								<>
									<Slider
										items={vcEntityList}
										renderSlideContent={renderSlideContent}
										onSlideChange={(currentIndex) => setCurrentSlide(currentIndex + 1)}
									/>

									{/* Update HistoryList based on current slide */}
									{vcEntityList[currentSlide - 1] && (
										<HistoryList
											credentialId={vcEntityList[currentSlide - 1].credentialIdentifier}
											history={history}
											title="Recent History"
											limit={3}
										/>
									)}
								</>
							) : (
									<div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 md:gap-5 lg:gap-10 lg:grid-cols-2 xl:grid-cols-3">
									{vcEntityList.map((vcEntity) => (
										<button
											key={vcEntity.id}
											className={`relative rounded-xl overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer ${latestCredentials.has(vcEntity.id) ? 'highlight-border fade-in' : ''}`}
											onClick={() => handleImageClick(vcEntity)}
											aria-label={`${vcEntity.friendlyName}`}
											title={t('pageCredentials.credentialDetailsTitle', { friendlyName: vcEntity.friendlyName })}
										>
											<CredentialImage credential={vcEntity.credential} className={`w-full h-full object-cover rounded-xl ${latestCredentials.has(vcEntity.id) ? 'highlight-filter' : ''}`} />
										</button>
									))}
									<AddCredentialCard onClick={handleAddCredential} />
								</div>
							)}
						</>
					)}
				</div>
			</div>
			{/* QR Code Scanner */}
			{isQRScannerOpen && (
				<QRCodeScanner onClose={closeQRScanner} />
			)}
		</>
	);
}

export default Home;
