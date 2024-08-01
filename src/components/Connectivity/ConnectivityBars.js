import React from 'react';
import { FaXmark } from "react-icons/fa6";
import { useTranslation } from 'react-i18next';

const ConnectivityBars = ({ quality, backgroundColor = 'light' }) => {

	const { t } = useTranslation();
	const bars = Array.from({ length: 5 }, (_, i) => i < quality);
	const barHeights = [4, 8, 12, 16, 20];
	const filledColor = backgroundColor === 'light' ? 'bg-primary dark:bg-white' : 'bg-white';
	const UnFilledColor = backgroundColor === 'light' ? 'bg-gray-300 dark:bg-gray-500' : 'bg-gray-500';

	const qualityText = (quality) => {
		switch (quality) {
			case 5: return 'Excellent';
			case 4: return 'Good';
			case 3: return 'Fair';
			case 2: return 'Poor';
			case 1: return 'Very Poor';
			default: return '';
		}
	};

	const titleText = quality !== 0
		? `${t("connectivityBars.title")} ${qualityText(quality)}`
		: t('common.offline');

	return (
		<div className="relative flex items-end" title={titleText}>
			{bars.map((filled, i) => (
				<div
					key={i}
					className={`w-1 mx-px ${filled ? filledColor : UnFilledColor}`}
					style={{ height: `${barHeights[i]}px` }}
				/>
			))}
			{quality === 0 && (
				<div className="absolute inset-0 flex items-center justify-center">
					<FaXmark size={16} className="text-gray-400 absolute bottom-[-4px] right-[-4px] bg-white border rounded-lg border-gray-400" />
				</div>
			)}
		</div>
	);
};

export default ConnectivityBars;
