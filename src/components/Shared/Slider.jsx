// External libraries
import React, { useState, useRef } from 'react';
import { BiLeftArrow, BiRightArrow } from 'react-icons/bi';
import { Swiper, SwiperSlide } from 'swiper/react';
import { useTranslation } from 'react-i18next';

// Styles
import { EffectCards } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-cards';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/pro-regular-svg-icons';

const Slider = ({ items, renderSlideContent, onSlideChange, initialSlide = 1 }) => {
	//General
	const { t } = useTranslation();

	//State
	const [currentSlide, setCurrentSlide] = useState(initialSlide);

	//Refs
	const sliderRef = useRef(null);

	//Handlers
	const handlePrev = () => {
		if (sliderRef.current) {
			sliderRef.current.slidePrev();
		}
	};

	const handleNext = () => {
		if (sliderRef.current) {
			sliderRef.current.slideNext();
		}
	};

	//Render
	return (
		<>
			<Swiper
				effect={'cards'}
				grabCursor={true}
				modules={[EffectCards]}
				slidesPerView={1}
				initialSlide={currentSlide - 1}
				onSlideChange={(swiper) => {
					setCurrentSlide(swiper.activeIndex + 1);
					if (onSlideChange) onSlideChange(swiper.activeIndex);
				}}
				onSwiper={(swiper) => (sliderRef.current = swiper)}
			>
				{items.map((item, index) => (
					<SwiperSlide
						key={item.id || index}
						className={`rounded-xl ${Math.abs(currentSlide - (index + 1)) > 1 && 'invisible pointer-events-none'} ${currentSlide === (index + 1) && 'overflow-visible-force'} `}
					>
						{renderSlideContent(item, index)}
					</SwiperSlide>
				))}
			</Swiper>

			{/* Display Slide numbers and Arrows if length >1 */}
			{items.length > 1 && (
				<div className="flex items-center justify-end space-x-2 mt-2">
					<span className="text-c-lm-gray-700 dark:text-c-dm-gray-300 mr-1">{currentSlide} of {items.length}</span>

					<button
						id="previous-slide"
						onClick={handlePrev}
						aria-label={currentSlide === 1 ? t('pageCredentials.slideButtonAriaLabelDisable', { direction: t('pageCredentials.slidePrevious') }) : t('pageCredentials.slideButtonAriaLabelEnable', { direction: t('pageCredentials.slidePrevious') })}
						title={currentSlide === 1 ? t('pageCredentials.slideButtonTitleDisable', { direction: t('pageCredentials.slidePrevious') }) : t('pageCredentials.slideButtonTitleEnable', { direction: t('pageCredentials.slidePrevious') })}
						disabled={currentSlide === 1}
						className={`
							flex items-center transition-all duration-150
							bg-c-lm-gray-300 dark:bg-c-dm-gray-700 rounded-lg w-8 h-8 flex justify-center items-center
							${currentSlide === 1 
								? 'opacity-50 cursor-not-allowed text-c-lm-gray-700 dark:text-c-dm-gray-300' 
								: 'text-c-lm-gray-700 dark:text-c-dm-gray-300 hover:text-c-lm-gray-900 dark:hover:text-c-dm-gray-100 hover:bg-c-lm-gray-400 dark:hover:bg-c-dm-gray-600'
							} 
						`}
					>
						<FontAwesomeIcon icon={faArrowLeft} className="text-lg" />
					</button>

					<button
						id="next-slide"
						onClick={handleNext}
						aria-label={currentSlide === items.length ? t('pageCredentials.slideButtonAriaLabelDisable', { direction: t('pageCredentials.slideNext') }) : t('pageCredentials.slideButtonAriaLabelEnable', { direction: t('pageCredentials.slideNext') })}
						title={currentSlide === items.length ? t('pageCredentials.slideButtonTitleDisable', { direction: t('pageCredentials.slideNext') }) : t('pageCredentials.slideButtonTitleEnable', { direction: t('pageCredentials.slideNext') })}
						disabled={currentSlide === items.length}
						className={`
							flex items-center transition-all duration-150
							bg-c-lm-gray-300 dark:bg-c-dm-gray-700 rounded-lg w-8 h-8 flex justify-center items-center
							${currentSlide === items.length 
								? 'opacity-50 cursor-not-allowed text-c-lm-gray-700 dark:text-c-dm-gray-300' 
								: 'text-c-lm-gray-700 dark:text-c-dm-gray-300 hover:text-c-lm-gray-900 dark:hover:text-c-dm-gray-100 hover:bg-c-lm-gray-400 dark:hover:bg-c-dm-gray-600'
							} 
						`}
					>
						<FontAwesomeIcon icon={faArrowRight} className="text-lg" />
					</button>
				</div>
			)}
		</>
	);
};

export default Slider;
