// External libraries
import React, { useState, useRef } from 'react';
import type { Key, ReactNode } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperInstance } from 'swiper';
import { useTranslation } from 'react-i18next';
import { EffectCards, Keyboard } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Styles
import 'swiper/css';
import 'swiper/css/effect-cards';

interface SliderProps<T extends object> {
	items: readonly T[];
	renderSlideContent: (item: T, index: number) => ReactNode;
	onSlideChange?: (index: number) => void;
	initialSlide?: number;
	className?: string;
}

const getSlideKey = <T extends object>(item: T, index: number): Key => {
	if ('batchId' in item) {
		const batchId = item.batchId;
		if (typeof batchId === 'string' || typeof batchId === 'number') {
			return batchId || index;
		}
	}
	return index;
};

function Slider<T extends object>({ items, renderSlideContent, onSlideChange, initialSlide = 1, className = '' }: SliderProps<T>) {
	const [currentSlide, setCurrentSlide] = useState(initialSlide);
	const sliderRef = useRef<SwiperInstance | null>(null);
	const { t } = useTranslation();

	const handlePrev = () => sliderRef.current?.slidePrev();
	const handleNext = () => sliderRef.current?.slideNext();

	return (
		<div className={`relative w-full overflow-visible ${className}`}>
			<Swiper
				effect="cards"
				grabCursor
				modules={[EffectCards, Keyboard]}
				keyboard
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
						key={getSlideKey(item, index)}
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
						className={`pointer-events-auto absolute top-1/2 -translate-y-1/2 left-1 z-10 p-2 bg-lm-gray-800 rounded-md ${currentSlide === 1
							? 'opacity-50 cursor-not-allowed text-lm-gray-100'
							: 'text-white hover:opacity-100 opacity-80'}`}
						aria-label={currentSlide === 1
							? t('pageCredentials.slideButtonAriaLabelDisable', { direction: t('pageCredentials.slidePrevious') })
							: t('pageCredentials.slideButtonAriaLabelEnable', { direction: t('pageCredentials.slidePrevious') })
						}
						title={
							currentSlide === 1
								? t('pageCredentials.slideButtonTitleDisable', { direction: t('pageCredentials.slidePrevious') })
								: t('pageCredentials.slideButtonTitleEnable', { direction: t('pageCredentials.slidePrevious') })
						}
					>
						<ChevronLeft size={22} />
					</button>

					<button
						id="next-slide"
						onClick={handleNext}
						disabled={currentSlide === items.length}
						className={`pointer-events-auto absolute top-1/2 -translate-y-1/2 right-1 bg-lm-gray-800 rounded-md z-10 p-2 ${currentSlide === items.length
							? 'opacity-50 cursor-not-allowed text-lm-gray-100'
							: 'text-white hover:opacity-100 opacity-80'}`}
						aria-label={currentSlide === items.length
							? t('pageCredentials.slideButtonAriaLabelDisable', { direction: t('pageCredentials.slideNext') })
							: t('pageCredentials.slideButtonAriaLabelEnable', { direction: t('pageCredentials.slideNext') })
						}
						title={
							currentSlide === items.length
								? t('pageCredentials.slideButtonTitleDisable', { direction: t('pageCredentials.slideNext') })
								: t('pageCredentials.slideButtonTitleEnable', { direction: t('pageCredentials.slideNext') })
						}
					>
						<ChevronRight size={22} />
					</button>

					<div className={`absolute bottom-3 z-10 left-2 ${className}`}>
						<div className="text-xs bg-lm-gray-800 w-max text-white dark:text-white px-2 py-1 rounded">
							{currentSlide}/{items.length}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default Slider;
