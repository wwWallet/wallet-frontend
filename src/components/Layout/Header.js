import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ConnectionStatusIcon from './Navigation/ConnectionStatusIcon';
import Logo from '../Logo/Logo';

const Header = () => {
	const { t } = useTranslation();
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > 35 && !isScrolled) {
				setIsScrolled(true);
			} else if (window.scrollY < 20 && isScrolled) {
				setIsScrolled(false);
			}
		};

		window.addEventListener('scroll', handleScroll);

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}, [isScrolled]);

	return (
		<header className={`sticky top-0 z-50 w-full bg-primary dark:bg-primary-hover text-white flex items-center justify-between shadow-md md:hidden rounded-b-lg transition-all duration-300 ${isScrolled ? 'p-3' : 'p-4'}`}>
			<ConnectionStatusIcon size={isScrolled ? 'small' : 'normal'} className="transition-all duration-300" />
			<div className="flex items-center">
				<Logo type='white' aClassName='mr-2' imgClassName={`cursor-pointer transition-all duration-300 ${isScrolled ? 'w-7' : 'w-10'}`} />
				<a href="/" className={`text-white font-bold cursor-pointer transition-all duration-300 ${isScrolled ? 'text-sm' : 'text-xl'}`}>
					{t('common.walletName')}
				</a>
			</div>
		</header>
	);
};

export default Header;
