import React from 'react';
import logoClassic from '../../assets/images/logo.png';
import logoWhite from '../../assets/images/wallet_white.png';

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
	// Determine which logo to use
	const logoSrc = type === 'white' ? logoWhite : logoClassic;

	return (
		<a href="/" className={aClassName}>
			<img src={logoSrc} alt={alt} className={imglassName} />
		</a>
	);
};

export default Logo;
