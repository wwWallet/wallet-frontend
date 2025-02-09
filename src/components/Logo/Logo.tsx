import React, { useEffect, useState } from 'react';
import logoClassic from '../../assets/images/logo.png';
import logoWhite from '../../assets/images/wallet_white.png';
import logoClassicChristmas from '../../assets/images/logo_christmas.png';
import logoWhiteChristmas from '../../assets/images/wallet_white_christmas.png';
import { useTranslation } from 'react-i18next';

interface LogoProps {
	type?: string; // Determines the type of logo (classic or white)
	aClassName?: string; // Class for the <a> element
	imgClassName?: string; // Class for the <img> element
}

const Logo: React.FC<LogoProps> = ({
	type = 'classic',
	aClassName = '',
	imgClassName = '',
}) => {
	const [isChristmasSeason, setIsChristmasSeason] = useState(false);
	const { t } = useTranslation();

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

	// Determine which logo to use
	const logoSrc = (() => {
		if (isChristmasSeason) {
			return type === 'white' ? logoWhiteChristmas : logoClassicChristmas;
		}
		return type === 'white' ? logoWhite : logoClassic;
	})();

	return (
		<a href="/" className={aClassName} aria-label={t('common.walletName')}>
			<img src={logoSrc} alt={t('common.walletName')} className={imgClassName} />
		</a>
	);
};

export default Logo;
