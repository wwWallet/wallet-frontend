import { BRANDING } from '@/config';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface LogoProps {
	type?: 'light' | 'dark'; // Determines the type of logo (light or dark)
	clickable?: boolean;
	alt?: string;
	aClassName?: string; // Class for the <a> element
	imgClassName?: string; // Class for the <img> element
}

function getLogoUrl(type: string): string {
	return type === 'light' || type === ''
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
	const [logoUrl, setLogoUrl] = useState<string>(getLogoUrl(type));

	useEffect(() => {
		if (type) return;

		const html = document.documentElement;
		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (
					mutation.type === 'attributes' &&
					mutation.attributeName === 'data-theme'
				) {
					setLogoUrl(getLogoUrl(html.getAttribute('data-theme')));
					}
			}
		});

		observer.observe(html, { attributes: true, attributeFilter: ['data-theme'] });

		return () => observer.disconnect();
	}, [type]);

	const img = <img src={logoUrl} alt={alt || t('common.walletName')} className={imgClassName} />

	if (clickable) return (
		<a href="/" className={aClassName} aria-label={t('common.walletName')}>
			{img}
		</a>
	);

	return img;
};

export default Logo;
