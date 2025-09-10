import React, { useMemo, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCreative, Mousewheel, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-creative';

const VerticalSlider = ({
	items,
	renderSlideContent,
	initialIndex = 0,
	onSlideChange,
	padStepVh = 4,
	padMaxVh = 10,
}) => {
	const [activeIndex, setActiveIndex] = useState(initialIndex);

	const paddingTop = useMemo(() => {
		const raw = activeIndex * padStepVh;
		const capped = Math.min(raw, padMaxVh);
		return `${capped}vh`;
	}, [activeIndex, padStepVh, padMaxVh]);

	return (
		<div
			className={`relative w-full overflow-visible sm:px-8 h-[60vh]`}
			style={{
				paddingTop,
				transition: 'padding 280ms ease-in-out',
			}}
		>
			<Swiper
				direction="vertical"
				modules={[EffectCreative, Mousewheel, Keyboard]}
				effect="creative"
				keyboard
				mousewheel
				grabCursor
				centeredSlides
				centeredSlidesBounds
				slidesPerView="auto"
				spaceBetween={24}
				initialSlide={initialIndex}
				onSlideChange={(sw) => {
					setActiveIndex(sw.activeIndex);
					onSlideChange?.(sw.activeIndex);
				}}
				creativeEffect={{
					perspective: true,
					shadowPerProgress: false,
					limitProgress: 3,
					prev: { translate: [0, -50, -120], scale: 0.94 },
					next: { translate: [0, 50, -120], scale: 0.94 },
				}}
				className="h-full vertical-stack-swiper"
			>
				{items.map((item, i) => (
					<SwiperSlide
						key={item.batchId ?? item.id ?? i}
						className={`!h-auto flex items-center justify-center ${Math.abs(activeIndex - (i)) > 2 && 'invisible pointer-events-none'
							} `}
					>
						<div className="w-full h-full rounded-xl p-2 px-4">
							{renderSlideContent(item, i)}
						</div>

						{items.length > 1 && activeIndex === i && (
							<div className="absolute bottom-5 z-50 left-5 text-xs bg-gray-500/40 text-white dark:text-white px-2 py-1 rounded">
								{activeIndex + 1}/{items.length}
							</div>
						)}
					</SwiperSlide>
				))}
			</Swiper>
		</div>
	);
};

export default VerticalSlider;
