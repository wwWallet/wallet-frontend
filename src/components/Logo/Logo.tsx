import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import logoClassic from '@/assets/images/logo.png';
import logoWhite from '@/assets/images/logo_white.png';
import logoClassicChristmas from '@/assets/images/logo_christmas.png';
import logoWhiteChristmas from '@/assets/images/logo_christmas_white.png';
import wordmarkClassic from '@/assets/images/wordmark.svg';
import wordmarkWhite from '@/assets/images/wordmark_white.svg';
import wordmarkClassicChristmas from '@/assets/images/wordmark_christmas.svg';
import wordmarkWhiteChristmas from '@/assets/images/wordmark_christmas_white.svg';

import { useTheme } from '@/context/ThemeContextProvider';

interface LogoProps {
	aClassName?: string; // Class for the <a> element
	imgClassName?: string; // Class for the <img> element
	isWordmark?: boolean; // Whether to use the wordmark logo
}

const Logo: React.FC<LogoProps> = ({
	aClassName = '',
	imgClassName = '',
	isWordmark = false,
}) => {
	//General
	const { t } = useTranslation();
	const { selectedTheme } = useTheme();

	//State
	const [isChristmasSeason, setIsChristmasSeason] = useState(false);

	//Effects
	useEffect(() => {
		const checkSeason = () => {
			const today = new Date(); // Use new Date() for real-time or new Date(new Date().getFullYear(), 0, 1) for testing January 1st
			const currentYear = today.getFullYear();

			// Christmas season part 1: December 1st to December 31st of the current year
			const christmasStart = new Date(currentYear, 11, 1); // December 1
			const christmasEnd = new Date(currentYear, 11, 31); // December 31

			// Christmas season part 2: January 1st to January 2nd of the next year
			const newYearStart = new Date(currentYear, 0, 1); // January 1
			const newYearEnd = new Date(currentYear, 0, 2); // January 2

			// Check if today is within either part of the Christmas season
			return (today >= christmasStart && today <= christmasEnd) ||
				(today >= newYearStart && today <= newYearEnd);
		};

		const seasonActive = checkSeason();
		setIsChristmasSeason(seasonActive);
	}, []);

	//Determine which logo to use
	const logoSrc = (() => {
		if (isChristmasSeason) {
			if (isWordmark) {
				return (
					selectedTheme.value === "system" ? 
						window.matchMedia('(prefers-color-scheme: dark)').matches ? 
							wordmarkWhiteChristmas 
						: 
							wordmarkClassicChristmas
					: selectedTheme.value === "dark" ? 
						wordmarkWhiteChristmas 
					: 
						wordmarkClassicChristmas
				);
			}
			return (
				selectedTheme.value === "system" ? 
					window.matchMedia('(prefers-color-scheme: dark)').matches ? 
						logoWhiteChristmas 
					: 
						logoClassicChristmas
				: selectedTheme.value === "dark" ? 
					logoWhiteChristmas 
				: 
					logoClassicChristmas
			);
		}

		if (isWordmark) {
			return (
				selectedTheme.value === "system" ? 
					window.matchMedia('(prefers-color-scheme: dark)').matches ? 
						wordmarkWhite 
					: 
						wordmarkClassic
				: selectedTheme.value === "dark" ? 
					wordmarkWhite 
				: 
					wordmarkClassic
			);
		}
		
		return (
			selectedTheme.value === "system" ? 
				window.matchMedia('(prefers-color-scheme: dark)').matches ? 
					logoWhite
				: 
					logoClassic
			: selectedTheme.value === "dark" ? 
				logoWhite
			: 
				logoClassic
		);
	})();

	//Render
	return (
		<a href="/" className={aClassName} aria-label={t('common.walletName')}>
			<div className={`relative ${imgClassName} flex items-center justify-center`}>
				<img src={logoSrc} alt={t('common.walletName')} className={`absolute object-cover object-center`} style={{ height: '160%' }} />
			</div>
		</a>
	);
};

export default Logo;
