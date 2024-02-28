import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { BsPlusCircle } from 'react-icons/bs';
import { BiLeftArrow, BiRightArrow } from 'react-icons/bi';
import {BsQrCodeScan} from 'react-icons/bs'

import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import addImage from '../../assets/images/cred.png';

import { useApi } from '../../api';
import CredentialInfo from '../../components/Credentials/CredentialInfo';
import CredentialJson from '../../components/Credentials/CredentialJson';
import CredentialDeleteButton from '../../components/Credentials/CredentialDeleteButton';
import { fetchCredentialData } from '../../components/Credentials/ApiFetchCredential';
import QRCodeScanner from '../../components/QRCodeScanner/QRCodeScanner';
import FullscreenPopup from '../../components/Popups/FullscreenImg';
import DeletePopup from '../../components/Popups/DeletePopup';

const Home = () => {
  const api = useApi();
  const [credentials, setCredentials] = useState([]);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 768);
  const [currentSlide, setCurrentSlide] = useState(1);
	const [showFullscreenImgPopup, setShowFullscreenImgPopup] = useState(false);
	const [selectedCredential, setSelectedCredential] = useState(null);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const sliderRef = useRef();
	const { t } = useTranslation();

	const settings = {
		dots: false,
		arrows: false,
		infinite: true,
		speed: 500,
		slidesToShow: 1,
		slidesToScroll: 1,
		afterChange: (current) => setCurrentSlide(current + 1),
		centerMode: true, // Enable center mode
		centerPadding: '10px', // Set the padding between adjacent images to 2 pixels
		style: { margin: '0 10px' },
	};

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
		const getData = async () => {
			const temp_cred = await fetchCredentialData(api);
			console.log(temp_cred);
			setCredentials(temp_cred);
		};
		getData();
	}, [api]);

  const handleAddCredential = () => {
    navigate('/add');
  };

  const handleImageClick = (credential) => {
			navigate(`/credential/${credential.id}`);
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
			await api.del(`/storage/vc/${selectedCredential.credentialIdentifier}`);
		} catch (error) {
			console.error('Failed to delete data', error);
		}
		setLoading(false);
		setShowDeletePopup(false);
		window.location.href = '/';
	};

  return (
    <>
      <div className="sm:px-6 w-full">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-custom-blue">{t('common.navItemCredentials')}</h1>

					<div className='flex gap-x-1'>
					{ isSmallScreen && (
						<button
						className="px-2 py-2 mb-2 text-white bg-custom-blue hover:bg-custom-blue-hover focus:ring-4 focus:outline-none focus:ring-custom-blue font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-custom-blue-hover dark:hover:bg-custom-blue-hover dark:focus:ring-custom-blue-hover"
						onClick={openQRScanner} // Open the QR code scanner modal
					>
						<div className="flex items-center">
							<BsQrCodeScan size={20} className="text-white" />
						</div>
					</button>
					)}
          <button
            className="px-2 py-2 mb-2 text-white bg-custom-blue hover:bg-custom-blue-hover focus:ring-4 focus:outline-none focus:ring-custom-blue font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-custom-blue-hover dark:hover:bg-custom-blue-hover dark:focus:ring-custom-blue-hover"
            onClick={handleAddCredential}
          >
            <div className="flex items-center">
              <BsPlusCircle size={20} className="text-white" />
              <span className="hidden sm:inline">&nbsp; {t('common.navItemCredentials')}</span>
            </div>
          </button>
					</div>


        </div>
        <hr className="mb-2 border-t border-custom-blue/80" />
        <p className="italic pd-2 text-gray-700">{t('pageCredentials.description')}</p>
        <div className='my-4'>
          {isSmallScreen ? (
		<>

							{credentials.length === 0 ? (
								<div
									className="relative rounded-xl overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer"
									onClick={handleAddCredential}
								>
									<img
										src={addImage}
										alt="add new credential"
										className="w-full h-auto object-cover rounded-xl opacity-100 hover:opacity-120"
									/>
									<div className="absolute inset-0 flex flex-col items-center justify-center text-center">
										<BsPlusCircle size={60} className="text-white mb-2 mt-4" />
										<span className="text-white font-semibold">{t('pageCredentials.addCardTitle')}</span>
									</div>
								</div>
							) : (
								<>
									<Slider ref={sliderRef} {...settings}>
										{credentials.map((credential) => (
											<>
												<div className="relative rounded-xl xl:w-4/5 md:w-full  sm:w-full overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer w-full" onClick={() => {setShowFullscreenImgPopup(true);setSelectedCredential(credential);}}>
													<img src={credential.src} alt={credential.alt} className="w-full h-full object-cover rounded-xl" />
												</div>
												<div className="flex items-center justify-end mt-2 mr-3">
													<span className="mr-4">{currentSlide} of {credentials.length}</span>
													<button className="" onClick={() => sliderRef.current.slickPrev()}>
														<BiLeftArrow size={22} />
													</button>
													<button onClick={() => sliderRef.current.slickNext()}>
														<BiRightArrow size={22} />
													</button>
												</div>
												<CredentialInfo credential={credential} />
							<CredentialDeleteButton onDelete={() => { setShowDeletePopup(true); setSelectedCredential(credential); }} />
												<CredentialJson credential={credential} />

											</>
										))}
									</Slider>
								</>
							)}
						</>
		) : (
							<div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20">
								{credentials.map((credential) => (
									<div
										key={credential.id}
										className="relative rounded-xl overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer"
										onClick={() => handleImageClick(credential)}
									>
										<img src={credential.src} alt={credential.alt} className="w-full h-full object-cover rounded-xl" />
									</div>
								))}
								<div
									className="relative rounded-xl overflow-hidden transition-shadow shadow-md hover:shadow-lg cursor-pointer"
									onClick={handleAddCredential}
								>
									<img
										src={addImage}
										alt="add new credential"
										className="w-full h-auto rounded-xl opacity-100 hover:opacity-120"
									/>
									<div className="absolute inset-0 flex flex-col items-center justify-center text-center">
										<BsPlusCircle size={60} className="text-white mb-2 mt-4" />
										<span className="text-white font-semibold">{t('pageCredentials.addCardTitle')}</span>
									</div>
								</div>
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
						<img src={selectedCredential.src} alt={selectedCredential.src} className="max-w-full max-h-full rounded-xl" />
					}
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

			{/* Delete Credential Modal */}
			{showDeletePopup && selectedCredential && (
				<DeletePopup
					isOpen={showDeletePopup}
					onConfirm={handleSureDelete}
					onCancel={() => setShowDeletePopup(false)}
					message={
						<span>
							{t('pageCredentials.deletePopup.messagePart1')}{' '} <strong> {selectedCredential.type.replace(/([A-Z])/g, ' $1')}</strong> {t('pageCredentials.deletePopup.messagePart2')}
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
