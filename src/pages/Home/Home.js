// External libraries
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BiLeftArrow, BiRightArrow } from 'react-icons/bi';
import Slider from 'react-slick';

// Styles
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

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

const Home = () => {
	const { vcEntityList, latestCredentials, getData } = useContext(CredentialsContext);
	const { isQRScannerOpen, openQRScanner, closeQRScanner } = useQRScanner();
	const { api } = useContext(SessionContext);
	const history = useFetchPresentations(api);
	const [currentSlide, setCurrentSlide] = useState(1);
	const screenType = useScreenType();

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

	const handleAddCredential = () => {
		navigate('/add');
	};

	const handleImageClick = (vcEntity) => {
		navigate(`/credential/${vcEntity.credentialIdentifier}`);
	};

	return (
		<>
			<div className="sm:px-6 w-full">
				<H1 heading={t('common.navItemCredentials')}>
					<QRButton openQRScanner={openQRScanner} />
				</H1>
				{screenType !== 'mobile' && (
					<p className="italic pd-2 text-gray-700 dark:text-gray-300">{t('pageCredentials.description')}</p>
				)}
				<div className='my-4'>
					{vcEntityList.length === 0 ? (
						<div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20">
							<AddCredentialCard onClick={handleAddCredential} />
						</div>
					) : (
						<>
							{screenType !== 'desktop' ? (
								<>
									<Slider ref={sliderRef} {...settings}>
										{vcEntityList.map((vcEntity, index) => (
											<div key={vcEntity.credentialIdentifier}>
												<button key={vcEntity.id} className={`relative rounded-xl xl:w-4/5 md:w-full sm:w-full overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer w-full mb-2 ${latestCredentials.has(vcEntity.id) ? 'fade-in' : ''}`}
													onClick={() => { handleImageClick(vcEntity) }}
													aria-label={`${vcEntity.friendlyName}`}
													tabIndex={currentSlide !== index + 1 ? -1 : 0}
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
													<HistoryList credentialIdentifier={vcEntity.credentialIdentifier} history={history} title='Recent History' limit={3} />
												</div>
											</div>

										))}
									</Slider>
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
									<AddCredentialCard onClick={handleAddCredential} />
								</div>
							)}
						</>
					)}
				</div>
			</div >

			{/* QR Code Scanner */}
			{isQRScannerOpen && (
				<QRCodeScanner onClose={closeQRScanner} />
			)}
		</>
	);
}

export default Home;
