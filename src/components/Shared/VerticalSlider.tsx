import React, { useMemo, useState } from 'react';
import type { Key, ReactNode } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCreative, Mousewheel, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-creative';

interface VerticalSliderProps<T extends object> {
	items: readonly T[];
	renderSlideContent: (item: T, index: number) => ReactNode;
	initialIndex?: number;
	onSlideChange?: (index: number) => void;
	padStepPx?: number;
	padMaxPx?: number;
}

const getSlideKey = <T extends object>(item: T, index: number): Key => {
	if ('batchId' in item) {
		const batchId = item.batchId;
		if (typeof batchId === 'string' || typeof batchId === 'number') {
			return batchId;
		}
	}
	if ('id' in item) {
		const id = item.id;
		if (typeof id === 'string' || typeof id === 'number') {
			return id;
		}
	}
	return index;
};

function VerticalSlider<T extends object>({
	items,
	renderSlideContent,
	initialIndex = 0,
	onSlideChange,
	padStepPx = 35,
	padMaxPx = 70,
}: VerticalSliderProps<T>) {
	const [activeIndex, setActiveIndex] = useState(initialIndex);

	const paddingTop = useMemo(() => {
		const raw = activeIndex * padStepPx;
		return `${Math.min(raw, padMaxPx)}px`;
	}, [activeIndex, padStepPx, padMaxPx]);

	return (
		<div
			className="relative w-full h-[30vh] sm:px-14 overflow-visible"
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
				slidesPerView="auto"
				spaceBetween={10}
				initialSlide={initialIndex}
				onSlideChange={(sw) => {
					setActiveIndex(sw.activeIndex);
					onSlideChange?.(sw.activeIndex);
				}}
				creativeEffect={{
					perspective: true,
					shadowPerProgress: false,
					limitProgress: 2,
					prev: { translate: [0, -50, 0], scale: 0.86 },
					next: { translate: [0, 50, 0], scale: 0.86 },
				}}
				className="h-full vertical-stack-swiper"
			>
				{items.map((item, i) => {
					const isActive = i === activeIndex;
					const isFar = Math.abs(activeIndex - i) > 2;

					return (
						<SwiperSlide
						key={getSlideKey(item, i)}
							className="h-auto! flex items-center justify-center"
							aria-hidden={isFar ? 'true' : 'false'}
						>
							<div
								className={[
									"w-full rounded-xl p-2 transition-all duration-300",
									isFar ? "pointer-events-none" : "pointer-events-auto",
									isActive ? "opacity-100" : "opacity-90",
									isActive ? "" : "filter-[brightness(0.9)]",
								].join(" ")}
							>
								{renderSlideContent(item, i)}
							</div>

							{items.length > 1 && isActive && (
								<div className="absolute bottom-5 left-6 z-50 text-xs bg-black/40 text-white px-2 py-1 rounded">
									{activeIndex + 1}/{items.length}
								</div>
							)}
						</SwiperSlide>
					);
				})}
			</Swiper>
		</div>
	);
}

export default VerticalSlider;
