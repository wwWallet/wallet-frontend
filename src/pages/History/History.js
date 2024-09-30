import React, { useState, useEffect, useRef, useContext } from 'react';
import Modal from 'react-modal';
import { BiLeftArrow, BiRightArrow } from 'react-icons/bi';
import { useTranslation } from 'react-i18next';

import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import SessionContext from '../../context/SessionContext';

import CredentialInfo from '../../components/Credentials/CredentialInfo';
import { formatDateTime } from '../../functions/DateFormat';
import { base64url } from 'jose';
import { CredentialImage } from '../../components/Credentials/CredentialImage';
import { H1 } from '../../components/Heading';
import { compareBy, reverse } from '../../util';


const History = () => {
	const { api } = useContext(SessionContext);
	const [history, setHistory] = useState([]);
	const [matchingCredentials, setMatchingCredentials] = useState([]);
	const [isImageModalOpen, setImageModalOpen] = useState(false);

	const [currentSlide, setCurrentSlide] = useState(1);

	const { t } = useTranslation();

	const sliderRef = useRef();

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

	const handleHistoryItemClick = async (item) => {
		// Export all credentials from the presentation
		const vpTokenPayload = JSON.parse(new TextDecoder().decode(
			base64url.decode(item.presentation.split('.')[1])
		));

		const verifiableCredentials = vpTokenPayload.vp.verifiableCredential; // in raw format

		// Set matching credentials and show the popup
		setMatchingCredentials(verifiableCredentials);
		setImageModalOpen(true);
	};

	useEffect(() => {
		const fetchedPresentations = async () => {
			try {
				const fetchedPresentations = await api.getAllPresentations();
				console.log(fetchedPresentations.vp_list);
				// Extract and map the vp_list from fetchedPresentations.
				const vpListFromApi = fetchedPresentations.vp_list
					.sort(reverse(compareBy(vp => vp.issuanceDate)))
					.map((item) => ({
						id: item.id,
						presentation: item.presentation,
						// ivci: item.includedVerifiableCredentialIdentifiers,
						audience: item.audience,
						issuanceDate: item.issuanceDate,
					}));

				setHistory(vpListFromApi);
			} catch (error) {
				console.error('Error fetching verifiers:', error);
			}
		};

		fetchedPresentations();
	}, [api]);

	return (
		<>
			<div className="sm:px-6 w-full">
				<H1 heading={t('common.navItemHistory')} />
				<p className="italic pd-2 text-gray-700 dark:text-gray-300">
					{t('pageHistory.description')}
				</p>

				{history.length === 0 ? (
					<p className="text-gray-700 dark:text-white mt-4">
						{t('pageHistory.noFound')}
					</p>
				) : (
					<div className="my-4 overflow-auto space-y-2" style={{ maxHeight: '85vh' }}>

						{history.map((item) => (
							<button
								key={item.id}
								className="bg-white dark:bg-gray-800 px-4 py-2 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 break-words w-full text-left"
								style={{ wordBreak: 'break-all' }}
								onClick={() => handleHistoryItemClick(item)}
							>
								<div className="font-bold">{item.audience}</div>
								<div>{formatDateTime(new Date(item.issuanceDate * 1000).toISOString())}</div>
							</button>
						))}
					</div>
				)}
			</div>

			{isImageModalOpen && (
				<Modal
					isOpen={true}
					onRequestClose={() => { setImageModalOpen(false); setCurrentSlide(1); }}
					className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-lg m-4 w-full lg:w-1/3 sm:w-2/3 relative"
					overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
				>
					{/* Popup content */}
					<div className="flex items-start justify-between mb-2 dark:border-gray-600">
						<h2 className="right text-lg font-bold text-primary dark:text-white">
							{t('pageHistory.popupTitle')}
						</h2>
						<button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" onClick={() => { setImageModalOpen(false); setCurrentSlide(1); }}>
							<svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
								<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
							</svg>
						</button>
					</div>
					<hr className="mb-2 border-t border-primary/80 dark:border-white/80" />

					{/* Display presented credentials */}
					<div className=" py-2">
						<Slider ref={sliderRef} {...settings}>
							{matchingCredentials.map((vcEntity, index) => {
								const Tag = currentSlide === index + 1 ? 'button' : 'div';
								return (
									<React.Fragment key={vcEntity}>
										<div
											className="relative rounded-xl xl:w-full md:w-full sm:w-full overflow-hidden transition-shadow shadow-md hover:shadow-lg w-full mb-2"
										>
											<CredentialImage credential={vcEntity} className={"w-full h-full object-cover rounded-xl"} />
										</div>
										<div className="flex items-center justify-end">
											<span className="mr-4 dark:text-white">{currentSlide} of {matchingCredentials.length}</span>
											<Tag
												onClick={() => sliderRef.current.slickPrev()}
												aria-label={currentSlide === 1 ? t('pageCredentials.slideButtonAriaLabelDisable', { direction: t('pageCredentials.slidePrevious') }) : t('pageCredentials.slideButtonAriaLabelEnable', { direction: t('pageCredentials.slidePrevious') })}
												title={currentSlide === 1 ? t('pageCredentials.slideButtonTitleDisable', { direction: t('pageCredentials.slidePrevious') }) : t('pageCredentials.slideButtonTitleEnable', { direction: t('pageCredentials.slidePrevious') })}
												disabled={currentSlide === 1}
												className={`${currentSlide === 1 ? 'opacity-50 cursor-not-allowed dark:text-gray-400' : 'text-primary dark:text-white hover:text-primary-hover dark:hover:text-gray-300'}`}
											>
												<BiLeftArrow size={22} />
											</Tag>
											<Tag
												onClick={() => sliderRef.current.slickNext()}
												aria-label={currentSlide === matchingCredentials.length ? t('pageCredentials.slideButtonAriaLabelDisable', { direction: t('pageCredentials.slideNext') }) : t('pageCredentials.slideButtonAriaLabelEnable', { direction: t('pageCredentials.slideNext') })}
												title={currentSlide === matchingCredentials.length ? t('pageCredentials.slideButtonTitleDisable', { direction: t('pageCredentials.slideNext') }) : t('pageCredentials.slideButtonTitleEnable', { direction: t('pageCredentials.slideNext') })}
												disabled={currentSlide === matchingCredentials.length}
												className={`${currentSlide === matchingCredentials.length ? 'opacity-50 cursor-not-allowed dark:text-gray-400' : 'text-primary dark:text-white hover:text-primary-hover dark:hover:text-primary-light-hover dark:hover:text-gray-300'}`}
											>
												<BiRightArrow size={22} />
											</Tag>
										</div>

										<div className='h-[30vh]'>

											<div className={`transition-all ease-in-out duration-500 ${(currentSlide === index + 1) ? 'max-h-[30vh] overflow-y-auto rounded-md custom-scrollbar my-2 bg-gray-800" opacity-100' : 'max-h-0 opacity-0'}`}>
												<CredentialInfo credential={vcEntity} />
											</div>
										</div>

									</React.Fragment>
								);
							})}
						</Slider>
					</div>
				</Modal>
			)}
		</>
	);
};

export default History;
