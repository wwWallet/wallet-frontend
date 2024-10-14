// External libraries
import React, { useState, useRef, useContext, useEffect } from 'react';
import Slider from 'react-slick';
import { BiLeftArrow, BiRightArrow } from 'react-icons/bi';
import { useTranslation } from 'react-i18next';

// Contexts
import SessionContext from '../../context/SessionContext';

// Styles
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Components
import CredentialInfo from '../Credentials/CredentialInfo';
import CredentialImage from '../Credentials/CredentialImage';

const HistoryDetailContent = ({ credentialIdentifier, historyItem }) => {
	const [currentSlide, setCurrentSlide] = useState(1);
	const { t } = useTranslation();
	const sliderRef = useRef();
	const { api } = useContext(SessionContext);
	const [vcEntity, setVcEntity] = useState(null);

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
		const getData = async () => {
			const response = await api.get('/storage/vc');
			const vcEntity = response.data.vc_list
				.filter((vcEntity) => vcEntity.credentialIdentifier == credentialIdentifier)[0];
			if (!vcEntity) {
				throw new Error("Credential not found");
			}
			setVcEntity(vcEntity);
		};

		if (credentialIdentifier) {
			getData();
		}
	}, [api, credentialIdentifier]);

	return (
		<>
			<div className=" py-2 w-full">
				<Slider ref={sliderRef} {...settings}>
					{historyItem && historyItem.map((credential, index) => {
						const Tag = currentSlide === index + 1 ? 'button' : 'div';
						return (
							<React.Fragment key={credential}>
								{!credentialIdentifier ? (
									<>
										<div
											className="relative rounded-xl xl:w-full md:w-full sm:w-full overflow-hidden transition-shadow shadow-md hover:shadow-lg w-full mb-2"
										>
											<CredentialImage credential={credential} className={"w-full h-full object-cover rounded-xl"} />
										</div>
										<div className="flex items-center justify-end">
											<span className="mr-4 dark:text-white">{currentSlide} of {historyItem.length}</span>
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
												aria-label={currentSlide === historyItem.length ? t('pageCredentials.slideButtonAriaLabelDisable', { direction: t('pageCredentials.slideNext') }) : t('pageCredentials.slideButtonAriaLabelEnable', { direction: t('pageCredentials.slideNext') })}
												title={currentSlide === historyItem.length ? t('pageCredentials.slideButtonTitleDisable', { direction: t('pageCredentials.slideNext') }) : t('pageCredentials.slideButtonTitleEnable', { direction: t('pageCredentials.slideNext') })}
												disabled={currentSlide === historyItem.length}
												className={`${currentSlide === historyItem.length ? 'opacity-50 cursor-not-allowed dark:text-gray-400' : 'text-primary dark:text-white hover:text-primary-hover dark:hover:text-primary-light-hover dark:hover:text-gray-300'}`}
											>
												<BiRightArrow size={22} />
											</Tag>
										</div>

										<div className='h-[30vh]'>
											<div className={`transition-all ease-in-out duration-500 ${(currentSlide === index + 1) ? 'max-h-[30vh] overflow-y-auto rounded-md custom-scrollbar my-2 bg-gray-800" opacity-100' : 'max-h-0 opacity-0'}`}>
												<CredentialInfo credential={credential} />
											</div>
										</div>
									</>
								) : (
									<div className="flex flex-col lg:flex-row lg:mt-5 mt-0">
										{/* Block 2: Information List */}
										{vcEntity && <CredentialInfo credential={vcEntity.credential} />} {/* Use the CredentialInfo component */}
									</div>
								)}
							</React.Fragment>
						);
					})}
				</Slider>
			</div>
		</>
	)
};

export default HistoryDetailContent;
