import React, { useState, useContext } from 'react';
import { AiOutlineMenu } from "react-icons/ai";
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Sidebar from './Sidebar';
import logo from '../assets/images/wallet_white.png';
import WelcomeTourGuide from './WelcomeTourGuide/WelcomeTourGuide';
import BottomNav from './BottomNav';
import OnlineStatusContext from '../context/OnlineStatusContext';
import { PiWifiHighBold, PiWifiSlashBold } from "react-icons/pi";


const Layout = ({ children }) => {
	const { isOnline } = useContext(OnlineStatusContext);
	const location = useLocation();
	const navigate = useNavigate();
	const [isOpen, setIsOpen] = useState(false);
	const toggleSidebar = () => setIsOpen(!isOpen);
	const { t } = useTranslation();

	const handleNavigate = (path) => {
		if (location.pathname === path) {
			window.location.reload();
		} else {
			navigate(path);
		}
	};

	return (
		<div className="flex min-h-screen">
			<Sidebar isOpen={isOpen} toggle={toggleSidebar} />

			{/* Header */}
			<header
				className={`${isOpen ? 'hidden' : 'z-50 fixed top-0 left-0 w-full bg-primary dark:bg-primary-hover text-white flex items-center justify-between p-4 shadow-md sm:hidden rounded-b-lg'}`}
			>
				{isOnline ? (
					<PiWifiHighBold size={25} title={t('common.online')} />
				) : (
					<PiWifiSlashBold size={25} title={t('common.offline')} />
				)}
				<div className="flex items-center">
					<button className='mr-2' onClick={() => handleNavigate('/')}>
						<img
							src={logo}
							alt="Logo"
							className="w-10 h-auto cursor-pointer"
						/>
					</button>
					<a href={('/')}
						className="text-white text-xl font-bold cursor-pointer"
					>
						{t('common.walletName')}
					</a>
				</div>
				<button className="text-white max480:hidden" onClick={toggleSidebar}>
					<AiOutlineMenu size={24} />
				</button>
			</header>

			<div className={`w-3/5 ${isOpen ? "hidden md:flex" : "flex"} flex-col flex-grow `}>
				{/* Content */}
				<div className="flex-grow bg-gray-100 dark:bg-gray-900 p-6 mt-10 pt-10 sm:mt-0 sm:pt-6 max480:pb-20 overflow-y-auto">
					{children}
				</div>
			</div>

			{/* Bottom Nav menu */}
			<BottomNav isOpen={isOpen} toggle={toggleSidebar} />
			<WelcomeTourGuide toggleMenu={toggleSidebar} isOpen={isOpen} />
		</div>
	);
};

export default Layout;
