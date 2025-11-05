import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface LogoProps {
	type?: string; // Determines the type of logo (classic or white)
	clickable?: boolean;
	alt?: string;
	aClassName?: string; // Class for the <a> element
	imgClassName?: string; // Class for the <img> element
}

const Logo: React.FC<LogoProps> = ({
	type = 'classic',
	clickable = true,
	alt,
	aClassName = '',
	imgClassName = '',
}) => {
	const { t } = useTranslation();
	const [logoUrl, setLogoUrl] = useState<string>('/logo_border.svg');

  useEffect(() => {
		if (type === 'white') return;

    const html = document.documentElement;
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "data-theme"
        ) {
          const theme = html.getAttribute("data-theme");

					setLogoUrl(
						theme === "light" || theme === ""
						? '/logo.svg'
						: '/logo_border.svg'
					);
        }
      }
    });

    observer.observe(html, { attributes: true, attributeFilter: ["data-theme"] });

    return () => observer.disconnect();
  }, [type]);

	const Img = () => <img src={logoUrl} alt={alt || t('common.walletName')} className={imgClassName} />

	if (clickable) return (
		<a href="/" className={aClassName} aria-label={t('common.walletName')}>
			<Img/>
		</a>
	);

	return <Img/>;
};

export default Logo;
