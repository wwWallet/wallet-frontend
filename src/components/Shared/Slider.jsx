// External libraries
import React, { useState, useRef } from 'react';
import { SlArrowLeft, SlArrowRight } from "react-icons/sl";
import { Swiper, SwiperSlide } from 'swiper/react';
import { useTranslation } from 'react-i18next';
import { EffectCards } from 'swiper/modules';

// Styles
import 'swiper/css';
import 'swiper/css/effect-cards';

const Slider = ({ items, renderSlideContent, onSlideChange, initialSlide = 1 }) => {
	const [currentSlide, setCurrentSlide] = useState(initialSlide);
	const sliderRef = useRef(null);
	const { t } = useTranslation();

	const handlePrev = () => sliderRef.current?.slidePrev();
	const handleNext = () => sliderRef.current?.slideNext();

	return (
		<div className="relative w-full overflow-visible">
			<Swiper
				effect="cards"
				grabCursor
				modules={[EffectCards]}
				slidesPerView={1}
				initialSlide={currentSlide - 1}
				onSlideChange={(swiper) => {
					setCurrentSlide(swiper.activeIndex + 1);
					onSlideChange?.(swiper.activeIndex);
				}}
				onSwiper={(swiper) => (sliderRef.current = swiper)}
			>
				{items.map((item, index) => (
					<SwiperSlide
						key={item.id || index}
						className={`rounded-xl ${Math.abs(currentSlide - (index + 1)) > 1 && 'invisible pointer-events-none'
							} ${currentSlide === index + 1 && 'overflow-visible-force'} `}
					>
						{renderSlideContent(item, index)}
					</SwiperSlide>
				))}
			</Swiper>

			{items.length > 1 && (
				<div className="pointer-events-none absolute inset-0">
					<button
						id="previous-slide"
						onClick={handlePrev}
						disabled={currentSlide === 1}
						className={`pointer-events-auto absolute top-1/2 -translate-y-1/2 -left-14 sm:-left-16 p-2
              ${currentSlide === 1
								? 'opacity-50 cursor-not-allowed text-gray-400'
								: 'text-primary dark:text-white hover:opacity-100'} opacity-90`}
						aria-label={
							currentSlide === 1
								? t('pageCredentials.slideButtonAriaLabelDisable', { direction: t('pageCredentials.slidePrevious') })
								: t('pageCredentials.slideButtonAriaLabelEnable', { direction: t('pageCredentials.slidePrevious') })
						}
						title={
							currentSlide === 1
								? t('pageCredentials.slideButtonTitleDisable', { direction: t('pageCredentials.slidePrevious') })
								: t('pageCredentials.slideButtonTitleEnable', { direction: t('pageCredentials.slidePrevious') })
						}
					>
						<SlArrowLeft size={35} />
					</button>

					<button
						id="next-slide"
						onClick={handleNext}
						disabled={currentSlide === items.length}
						className={`pointer-events-auto absolute top-1/2 -translate-y-1/2 -right-14 sm:-right-16 p-2
              ${currentSlide === items.length
								? 'opacity-50 cursor-not-allowed text-gray-400'
								: 'text-primary dark:text-white hover:opacity-100'} opacity-90`}
						aria-label={
							currentSlide === items.length
								? t('pageCredentials.slideButtonAriaLabelDisable', { direction: t('pageCredentials.slideNext') })
								: t('pageCredentials.slideButtonAriaLabelEnable', { direction: t('pageCredentials.slideNext') })
						}
						title={
							currentSlide === items.length
								? t('pageCredentials.slideButtonTitleDisable', { direction: t('pageCredentials.slideNext') })
								: t('pageCredentials.slideButtonTitleEnable', { direction: t('pageCredentials.slideNext') })
						}
					>
						<SlArrowRight size={35} />
					</button>

					<div className="absolute bottom-3 z-10 left-2 text-xs bg-black/30 text-white dark:text-white px-2 py-1 rounded">
						{currentSlide}/{items.length}
					</div>
				</div>
			)}
		</div>
	);
};

export default Slider;
