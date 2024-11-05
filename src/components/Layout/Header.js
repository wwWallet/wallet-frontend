import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ConnectionStatusIcon from './Navigation/ConnectionStatusIcon';
import logo from '../../assets/images/wallet_white.png';

const Header = () => {
	const navigate = useNavigate();
	const location = useLocation();
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

	const handleNavigate = (path) => {
		if (location.pathname === path) {
			window.location.reload();
		} else {
			navigate(path);
		}
	};

	return (
		<header className={`sticky top-0 z-50 w-full bg-primary dark:bg-primary-hover text-white flex items-center justify-between shadow-md md:hidden rounded-b-lg transition-all duration-300 ${isScrolled ? 'p-3' : 'p-4'}`}>
			<ConnectionStatusIcon size={isScrolled ? 20 : 25} className="transition-all duration-300" />
			<div className="flex items-center">
				<button className='mr-2' onClick={() => handleNavigate('/')}>
					<img
						src={logo}
						alt="Logo"
						className={`cursor-pointer transition-all duration-300 ${isScrolled ? 'w-7' : 'w-10'}`}
					/>
				</button>
				<a href="/" className={`text-white font-bold cursor-pointer transition-all duration-300 ${isScrolled ? 'text-sm' : 'text-xl'}`}>
					{t('common.walletName')}
				</a>
			</div>
		</header>
	);
};

export default Header;
