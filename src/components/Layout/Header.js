import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ConnectionStatusIcon from './Navigation/ConnectionStatusIcon';
import logo from '../../assets/images/wallet_white.png';

const Header = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { t } = useTranslation();

	const handleNavigate = (path) => {
		if (location.pathname === path) {
			window.location.reload();
		} else {
			navigate(path);
		}
	};

	return (
		<header className="z-50 fixed top-0 left-0 w-full bg-primary dark:bg-primary-hover text-white flex items-center justify-between p-4 shadow-md md:hidden rounded-b-lg">
			<ConnectionStatusIcon size={25} />
			<div className="flex items-center">
				<button className='mr-2' onClick={() => handleNavigate('/')}>
					<img
						src={logo}
						alt="Logo"
						className="w-10 h-auto cursor-pointer"
					/>
				</button>
				<a href="/" className="text-white text-xl font-bold cursor-pointer">
					{t('common.walletName')}
				</a>
			</div>
		</header>
	);
};

export default Header;
