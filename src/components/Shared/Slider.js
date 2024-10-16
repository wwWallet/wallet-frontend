// External libraries
import React, { useState, useRef } from 'react';
import { BiLeftArrow, BiRightArrow } from 'react-icons/bi';
import { Swiper, SwiperSlide } from 'swiper/react';
import { useTranslation } from 'react-i18next';

// Styles
import { EffectCards } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-cards';

const Slider = ({ items, renderSlideContent, onSlideChange }) => {
	const [currentSlide, setCurrentSlide] = useState(1);
	const sliderRef = useRef(null);
	const { t } = useTranslation();

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

	return (
		<>
			<Swiper
				effect={'cards'}
				grabCursor={true}
				modules={[EffectCards]}
				slidesPerView={1}
				onSlideChange={(swiper) => {
					setCurrentSlide(swiper.activeIndex + 1);
					if (onSlideChange) onSlideChange(swiper.activeIndex);
				}}
				onSwiper={(swiper) => (sliderRef.current = swiper)}
			>
				{items.map((item, index) => (
					<SwiperSlide
						key={item.id || index}
						className={`swiper-slide ${Math.abs(currentSlide - (index + 1)) > 1 ? 'hidden-slide' : ''}`}
					>
						{renderSlideContent(item, index)}
					</SwiperSlide>
				))}
			</Swiper>

			{/* Display Slide numbers and Arrows if length >1 */}
			{items.length > 1 && (
				<div className="flex items-center justify-end mt-1">
					<span className="mr-4 dark:text-white">{currentSlide} of {items.length}</span>
					<button
						onClick={handlePrev}
						aria-label={currentSlide === 1 ? t('pageCredentials.slideButtonAriaLabelDisable', { direction: t('pageCredentials.slidePrevious') }) : t('pageCredentials.slideButtonAriaLabelEnable', { direction: t('pageCredentials.slidePrevious') })}
						title={currentSlide === 1 ? t('pageCredentials.slideButtonTitleDisable', { direction: t('pageCredentials.slidePrevious') }) : t('pageCredentials.slideButtonTitleEnable', { direction: t('pageCredentials.slidePrevious') })}
						disabled={currentSlide === 1}
						className={`${currentSlide === 1 ? 'opacity-50 cursor-not-allowed text-gray-500 dark:text-gray-200' : 'text-primary dark:text-white hover:text-primary-hover dark:hover:text-gray-300'}`}
					>
						<BiLeftArrow size={22} />
					</button>
					<button
						onClick={handleNext}
						aria-label={currentSlide === items.length ? t('pageCredentials.slideButtonAriaLabelDisable', { direction: t('pageCredentials.slideNext') }) : t('pageCredentials.slideButtonAriaLabelEnable', { direction: t('pageCredentials.slideNext') })}
						title={currentSlide === items.length ? t('pageCredentials.slideButtonTitleDisable', { direction: t('pageCredentials.slideNext') }) : t('pageCredentials.slideButtonTitleEnable', { direction: t('pageCredentials.slideNext') })}
						disabled={currentSlide === items.length}
						className={`${currentSlide === items.length ? 'opacity-50 cursor-not-allowed text-gray-500 dark:text-gray-200' : 'text-primary dark:text-white hover:text-primary-hover dark:hover:text-gray-300'}`}
					>
						<BiRightArrow size={22} />
					</button>
				</div>
			)}
		</>
	);
};

export default Slider;
