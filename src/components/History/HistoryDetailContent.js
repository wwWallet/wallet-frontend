// External libraries
import React, { useState, useRef, useContext, useEffect } from 'react';
import { BiLeftArrow, BiRightArrow } from 'react-icons/bi';
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from 'swiper/react';

// Styles
import { EffectCards } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-cards';

// Contexts
import SessionContext from '../../context/SessionContext';

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

	console.log(historyItem);
	return (
		<>
			<div className="py-2 w-full">

				<div className='px-2'>
					<Swiper
						effect={'cards'}
						grabCursor={true}
						modules={[EffectCards]}
						slidesPerView={1}
						className="mySwiper"
						onSlideChange={(swiper) => setCurrentSlide(swiper.activeIndex + 1)}
						onSwiper={(swiper) => (sliderRef.current = swiper)}
					>
						{historyItem && historyItem.map((credential, index) => (
							<SwiperSlide
								key={credential.credentialIdentifier}
								className={`swiper-slide ${Math.abs(currentSlide - (index + 1)) > 1 ? 'hidden-slide' : ''}`}
							>
								<div
									key={credential.id}
									className={`relative rounded-xl w-full transition-shadow shadow-md hover:shadow-lg cursor-pointer`}
									aria-label={`${credential.friendlyName}`}
									title={t('pageCredentials.credentialFullScreenTitle', { friendlyName: credential.friendlyName })}
								>
									<CredentialImage credential={credential} className={`w-full h-full rounded-xl`} />
								</div>
							</SwiperSlide>
						))}
					</Swiper>
				</div>

				{/* Display Slides numbers and Arrows */}
				<div className="flex items-center justify-end">
					<span className="mr-4 dark:text-white">{currentSlide} of {historyItem.length}</span>
					<button
						onClick={() => sliderRef.current.slidePrev()}
						aria-label={currentSlide === 1 ? t('pageCredentials.slideButtonAriaLabelDisable', { direction: t('pageCredentials.slidePrevious') }) : t('pageCredentials.slideButtonAriaLabelEnable', { direction: t('pageCredentials.slidePrevious') })}
						title={currentSlide === 1 ? t('pageCredentials.slideButtonTitleDisable', { direction: t('pageCredentials.slidePrevious') }) : t('pageCredentials.slideButtonTitleEnable', { direction: t('pageCredentials.slidePrevious') })}
						disabled={currentSlide === 1}
						className={` ${currentSlide === 1 ? 'opacity-50 cursor-not-allowed dark:text-gray-400' : 'text-primary dark:text-white hover:text-primary-hover dark:hover:text-gray-300'}`}
					>
						<BiLeftArrow size={22} />
					</button>
					<button
						onClick={() => sliderRef.current.slideNext()}
						aria-label={currentSlide === historyItem.length ? t('pageCredentials.slideButtonAriaLabelDisable', { direction: t('pageCredentials.slideNext') }) : t('pageCredentials.slideButtonAriaLabelEnable', { direction: t('pageCredentials.slideNext') })}
						title={currentSlide === historyItem.length ? t('pageCredentials.slideButtonTitleDisable', { direction: t('pageCredentials.slideNext') }) : t('pageCredentials.slideButtonTitleEnable', { direction: t('pageCredentials.slideNext') })}
						disabled={currentSlide === historyItem.length}
						className={`${currentSlide === historyItem.length ? 'opacity-50 cursor-not-allowed dark:text-gray-400' : 'text-primary dark:text-white hover:text-primary-hover dark:hover:text-gray-300'}`}
					>
						<BiRightArrow size={22} />
					</button>
				</div>

				{historyItem[currentSlide - 1] && (
					<CredentialInfo
						credential={historyItem[currentSlide - 1]}

					/>
				)}
			</div>
		</>
	)
};

export default HistoryDetailContent;
