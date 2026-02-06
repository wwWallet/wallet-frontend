import React, { useState } from 'react';
import Sidebar from '../Layout/Navigation/Sidebar';
import WelcomeTourGuide from '../WelcomeTourGuide/WelcomeTourGuide';
import BottomNav from './Navigation/BottomNav';
import Header from './Header';

const Layout = ({ children }) => {
	const [isOpen, setIsOpen] = useState(false);
	const toggleSidebar = () => setIsOpen(!isOpen);

	return (
		<div className="flex justify-end min-h-dvh flex-col md:flex-row bg-lm-gray-100 dark:bg-dm-gray-900">
			<Sidebar isOpen={isOpen} toggle={toggleSidebar} />

			{/* Header */}
			{!isOpen && <Header />}

			<div className={`w-full md:w-3/5 ${isOpen ? "hidden md:flex" : "flex"} flex-col grow `}>
				{/* Content */}
				<div className="w-full grow bg-lm-gray-100 dark:bg-dm-gray-900 py-6 md:mt-0 md:pt-6">
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
