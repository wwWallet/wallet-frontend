// External libraries
import React, { useState, useRef } from 'react';
import { BiLeftArrow, BiRightArrow } from 'react-icons/bi';
import { Swiper, SwiperSlide } from 'swiper/react';

// Styles
import { EffectCards } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-cards';

const Slider = ({ items, renderSlideContent, onSlideChange }) => {
	const [currentSlide, setCurrentSlide] = useState(1);
	const sliderRef = useRef(null);

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
					<span className="mr-4">{currentSlide} of {items.length}</span>
					<button
						onClick={handlePrev}
						disabled={currentSlide === 1}
						className={` ${currentSlide === 1 ? 'opacity-50 cursor-not-allowed' : 'text-primary hover:text-primary-hover'}`}
					>
						<BiLeftArrow size={22} />
					</button>
					<button
						onClick={handleNext}
						disabled={currentSlide === items.length}
						className={` ${currentSlide === items.length ? 'opacity-50 cursor-not-allowed' : 'text-primary hover:text-primary-hover'}`}
					>
						<BiRightArrow size={22} />
					</button>
				</div>
			)}
		</>
	);
};

export default Slider;
