import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { BsPlusCircle } from 'react-icons/bs';
import { BiLeftArrow, BiRightArrow } from 'react-icons/bi';

import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import addImage from '../../assets/images/cred.png';

import { useApi } from '../../api';
import CredentialInfo from '../../components/Credentials/CredentialInfo';
import CredentialJson from '../../components/Credentials/CredentialJson';
import CredentialDeleteButton from '../../components/Credentials/CredentialDeleteButton';
import QRCodeScanner from '../../components/QRCodeScanner/QRCodeScanner';
import FullscreenPopup from '../../components/Popups/FullscreenImg';
import DeletePopup from '../../components/Popups/DeletePopup';
import { CredentialImage } from '../../components/Credentials/CredentialImage';
import QRButton from '../../components/Buttons/QRButton';
import CredentialsContext from '../../context/CredentialsContext';

const Home = () => {
	const api = useApi();
	const { vcEntityList, latestCredentials, getData } = useContext(CredentialsContext);
	const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);
	const [currentSlide, setCurrentSlide] = useState(1);
	const [showFullscreenImgPopup, setShowFullscreenImgPopup] = useState(false);
	const [selectedVcEntity, setSelectedVcEntity] = useState(null);
	const [showDeletePopup, setShowDeletePopup] = useState(false);
	const [loading, setLoading] = useState(false);

	const navigate = useNavigate();
	const sliderRef = useRef();
	const { t } = useTranslation();

	const settings = {
		dots: false,
		arrows: false,
		infinite: false,
		speed: 500,
		slidesToShow: 1,
		slidesToScroll: 1,
		afterChange: (current) => {
			setCurrentSlide(current + 1);
		},
		centerMode: true,
		centerPadding: '10px',
		style: { margin: '0 10px' },
	};

	useEffect(() => {
		getData();
	}, [getData]);

	useEffect(() => {
		const handleResize = () => {
			setIsSmallScreen(window.innerWidth < 768);
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	const handleAddCredential = () => {
		navigate('/add');
	};

	const handleImageClick = (vcEntity) => {
		navigate(`/credential/${vcEntity.credentialIdentifier}`);
	};

	// QR Code part
	const [isQRScannerOpen, setQRScannerOpen] = useState(false);

	const openQRScanner = () => {
		setQRScannerOpen(true);
	};

	const closeQRScanner = () => {
		setQRScannerOpen(false);
	};

	const handleSureDelete = async () => {
		setLoading(true);
		try {
			await api.del(`/storage/vc/${selectedVcEntity.credentialIdentifier}`);
			await getData();
		} catch (error) {
			console.error('Failed to delete data', error);
		}
		setLoading(false);
		setShowDeletePopup(false);
	};

	return (
		<>
			<div className="sm:px-6 w-full">
				<div className="flex justify-between items-center">
					<h1 className="text-2xl mb-2 font-bold text-primary dark:text-white">{t('common.navItemCredentials')}</h1>
					<QRButton openQRScanner={openQRScanner} isSmallScreen={isSmallScreen} />
				</div>
				<hr className="mb-2 border-t border-primary/80 dark:border-white/80" />
				<p className="italic pd-2 text-gray-700 dark:text-gray-300">{t('pageCredentials.description')}</p>
				<div className='my-4'>
					{isSmallScreen ? (
						<>

							{vcEntityList.length === 0 ? (
								<button
									className="step-1 relative rounded-xl overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer"
									onClick={handleAddCredential}
								>
									<img
										src={addImage}
										className="w-full h-auto object-cover rounded-xl opacity-100 hover:opacity-120"
									/>
									<div className="absolute inset-0 flex flex-col items-center justify-center text-center">
										<BsPlusCircle size={60} className="text-white mb-2 mt-4" />
										<span className="text-white font-semibold">{t('pageCredentials.addCardTitle')}</span>
									</div>
								</button>
							) : (
								<>
									<Slider ref={sliderRef} {...settings}>
										{vcEntityList.map((vcEntity, index) => (
											<div key={vcEntity.id}>
												<button key={vcEntity.id} className={`relative rounded-xl xl:w-4/5 md:w-full sm:w-full overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer w-full mb-2 ${latestCredentials.has(vcEntity.id) ? 'fade-in' : ''}`}
													onClick={() => { setShowFullscreenImgPopup(true); setSelectedVcEntity(vcEntity); }}
													aria-label={`${vcEntity.friendlyName}`}
													tabindex={(currentSlide != index + 1) && -1}
													title={t('pageCredentials.credentialFullScreenTitle', { friendlyName: vcEntity.friendlyName })}
												>
													<CredentialImage credential={vcEntity.credential} className={`w-full h-full object-cover rounded-xl ${latestCredentials.has(vcEntity.id) ? 'highlight-filter' : ''}`} />
												</button>
												<div className={`transition-all ease-in-out duration-500 ${(currentSlide === index + 1) ? 'max-h-auto opacity-100' : 'hidden max-h-0 opacity-0'}`}>
													<div className="flex items-center justify-end">
														<span className="mr-4 dark:text-white">{currentSlide} of {vcEntityList.length}</span>
														<button
															onClick={() => sliderRef.current.slickPrev()}
															aria-label={currentSlide === 1 ? t('pageCredentials.slideButtonAriaLabelDisable', { direction: t('pageCredentials.slidePrevious') }) : t('pageCredentials.slideButtonAriaLabelEnable', { direction: t('pageCredentials.slidePrevious') })}
															title={currentSlide === 1 ? t('pageCredentials.slideButtonTitleDisable', { direction: t('pageCredentials.slidePrevious') }) : t('pageCredentials.slideButtonTitleEnable', { direction: t('pageCredentials.slidePrevious') })}
															disabled={currentSlide === 1}
															className={`${currentSlide === 1 ? 'opacity-50 cursor-not-allowed dark:text-gray-400' : 'text-primary dark:text-white hover:text-primary-hover dark:hover:text-gray-300'}`}
														>
															<BiLeftArrow size={22} />
														</button>
														<button
															onClick={() => sliderRef.current.slickNext()}
															aria-label={currentSlide === vcEntityList.length ? t('pageCredentials.slideButtonAriaLabelDisable', { direction: t('pageCredentials.slideNext') }) : t('pageCredentials.slideButtonAriaLabelEnable', { direction: t('pageCredentials.slideNext') })}
															title={currentSlide === vcEntityList.length ? t('pageCredentials.slideButtonTitleDisable', { direction: t('pageCredentials.slideNext') }) : t('pageCredentials.slideButtonTitleEnable', { direction: t('pageCredentials.slideNext') })}
															disabled={currentSlide === vcEntityList.length}
															className={`${currentSlide === vcEntityList.length ? 'opacity-50 cursor-not-allowed dark:text-gray-400' : 'text-primary dark:text-white hover:text-primary-hover dark:hover:text-gray-300'}`}
														>
															<BiRightArrow size={22} />
														</button>
													</div>
													<CredentialInfo credential={vcEntity.credential} />
													<CredentialDeleteButton onDelete={() => { setShowDeletePopup(true); setSelectedVcEntity(vcEntity); }} />
													<CredentialJson credential={vcEntity.credential} />
												</div>
											</div>
										))}
									</Slider>
								</>
							)}
						</>
					) : (
						<div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20">
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
							<button
								className="step-1 relative rounded-xl overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer"
								onClick={handleAddCredential}
							>
								<img
									src={addImage}
									className="w-full h-auto rounded-xl opacity-100 hover:opacity-120"
								/>
								<div className="absolute inset-0 flex flex-col items-center justify-center text-center">
									<BsPlusCircle size={60} className="text-white mb-2 mt-4" />
									<span className="text-white font-semibold">{t('pageCredentials.addCardTitle')}</span>
								</div>
							</button>
						</div>
					)}
				</div>
			</div>
			{/* Modal for Fullscreen credential */}
			{showFullscreenImgPopup && (
				<FullscreenPopup
					isOpen={showFullscreenImgPopup}
					onClose={() => setShowFullscreenImgPopup(false)}
					content={
						<CredentialImage credential={selectedVcEntity.credential} className={"max-w-full max-h-full rounded-xl"} showRibbon={false} />
					}
				/>
			)}

			{/* QR Code Scanner Modal */}
			{isQRScannerOpen && (
				<QRCodeScanner
					onClose={closeQRScanner}
				/>
			)}

			{/* Delete Credential Modal */}
			{showDeletePopup && selectedVcEntity && (
				<DeletePopup
					isOpen={showDeletePopup}
					onConfirm={handleSureDelete}
					onCancel={() => setShowDeletePopup(false)}
					message={
						<span>
							{t('pageCredentials.deletePopup.messagePart1')}{' '} <strong> {selectedVcEntity.credentialIdentifier}</strong> {t('pageCredentials.deletePopup.messagePart2')}
							<br /> {t('pageCredentials.deletePopup.messagePart3')}{' '} <strong>{t('pageCredentials.deletePopup.messagePart4')}</strong>
						</span>
					}
					loading={loading}
				/>
			)}
		</>
	);
};

export default Home;
