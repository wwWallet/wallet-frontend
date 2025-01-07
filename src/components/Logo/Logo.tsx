import React, { useEffect, useState } from 'react';
import logoClassic from '../../assets/images/logo.png';
import logoWhite from '../../assets/images/wallet_white.png';
import logoClassicChristmas from '../../assets/images/logo_christmas.png';
import logoWhiteChristmas from '../../assets/images/wallet_white_christmas.png';

interface LogoProps {
	type?: string; // Determines the type of logo (classic or white)
	aClassName?: string; // Class for the <a> element
	imglassName?: string; // Class for the <img> element
	alt?: string; // Alt text for the logo
}

const Logo: React.FC<LogoProps> = ({
	type = 'classic',
	aClassName = '',
	imglassName = '',
	alt = 'Logo',
}) => {
	const [isChristmasSeason, setIsChristmasSeason] = useState(false);

	useEffect(() => {
		const checkSeason = () => {
			const today = new Date();
			const currentYear = today.getFullYear();
			const start = new Date(currentYear, 11, 1); // December 1
			const end = new Date(currentYear + 1, 0, 2); // January 2
			return today >= start && today <= end;
		};

		setIsChristmasSeason(checkSeason());
	}, []);

	// Determine which logo to use
	const logoSrc = (() => {
		if (isChristmasSeason) {
			return type === 'white' ? logoWhiteChristmas : logoClassicChristmas;
		}
		return type === 'white' ? logoWhite : logoClassic;
	})();

	return (
		<a href="/" className={aClassName}>
			<img src={logoSrc} alt={alt} className={imglassName} />
		</a>
	);
};

export default Logo;
