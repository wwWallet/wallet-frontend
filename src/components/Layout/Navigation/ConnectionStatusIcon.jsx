import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import StatusContext from '@/context/StatusContext';
import { FaXmark } from "react-icons/fa6";

const ConnectionStatusIcon = ({ size = 'normal', backgroundColor = 'dark' }) => {
	const { connectivity } = useContext(StatusContext);
	const { t } = useTranslation();

	console.log('connectivity', connectivity)
	const quality = connectivity.speed;
	const bars = Array.from({ length: 5 }, (_, i) => i < quality);
	const barHeights = size === 'normal' ? [4, 8, 12, 16, 20] : [3, 6, 9, 12, 16];
	const filledColor = backgroundColor === 'light' ? 'bg-primary dark:bg-white' : 'bg-white';
	const UnFilledColor = backgroundColor === 'light' ? 'bg-gray-300 dark:bg-gray-500' : 'bg-gray-500';
	const connectingSpinner = backgroundColor === 'light' ? 'border-gray-600 dark:border-gray-100' : 'border-gray-100';

	const qualityText = (quality) => {
		switch (quality) {
			case 5: return t('ConnectionStatusIcon.qualityLabels.excellent');
			case 4: return t('ConnectionStatusIcon.qualityLabels.good');
			case 3: return t('ConnectionStatusIcon.qualityLabels.fair');
			case 2: return t('ConnectionStatusIcon.qualityLabels.poor');
			case 1: return t('ConnectionStatusIcon.qualityLabels.veryPoor');
			case 0: return t('common.offline');
			default: return t('ConnectionStatusIcon.qualityLabels.connecting');
		}
	};

	const titleText = `${t("ConnectionStatusIcon.status")} ${qualityText(quality)}`;

	return (
		<div className="relative flex items-end" title={titleText}>
			{bars.map((filled, i) => (
				<div
					key={i}
					className={`${size === 'small' ? 'w-[3px]' : 'w-[4px]'} mx-px rounded-t-[1px] ${filled ? filledColor : UnFilledColor}`}
					style={{ height: `${barHeights[i]}px` }}
				/>
			))}
			{quality === 0 ? (
				<div className="absolute inset-0 flex items-center justify-center">
					<FaXmark size={16} className="text-gray-400 absolute bottom-[-4px] right-[-4px] bg-white border rounded-lg border-gray-400" />
				</div>
			) : quality === null && (
				<div className="absolute inset-0 flex items-center justify-center bg-opacity-30">
					<div className={`h-4 w-4 border-[2px] border-t-transparent dark:border-t-transparent ${connectingSpinner} absolute bottom-0 rounded-full animate-spin`} />
				</div>
			)}
		</div>
	);
};

export default ConnectionStatusIcon;
