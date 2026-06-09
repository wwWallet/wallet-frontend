import { BRANDING } from '@/config';
import React, { useContext } from 'react';
import AppSettingsContext from '@/context/AppSettingsContext';
import { useTranslation } from 'react-i18next';

type LogoType = 'light' | 'dark';

interface LogoProps {
	type?: LogoType; // Determines the type of logo (light or dark)
	clickable?: boolean;
	alt?: string;
	aClassName?: string; // Class for the <a> element
	imgClassName?: string; // Class for the <img> element
}

function getLogoUrl(type: LogoType): string {
	return type === 'light'
		? BRANDING.LOGO_LIGHT
		: BRANDING.LOGO_DARK;
}

const Logo: React.FC<LogoProps> = ({
	type,
	clickable = true,
	alt,
	aClassName = '',
	imgClassName = '',
}) => {
	const { t } = useTranslation();
	const { resolvedColorScheme } = useContext(AppSettingsContext);
	const logoUrl = getLogoUrl(type ?? resolvedColorScheme);

	const img = <img src={logoUrl} alt={alt || t('common.walletName')} className={imgClassName} />

	if (clickable) return (
		<a href="/" className={aClassName} aria-label={t('common.walletName')}>
			{img}
		</a>
	);

	return img;
};

export default Logo;
