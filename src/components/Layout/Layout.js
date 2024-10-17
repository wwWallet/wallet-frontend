import React, { useState } from 'react';
import Sidebar from '../Layout/Navigation/Sidebar';
import WelcomeTourGuide from '../WelcomeTourGuide/WelcomeTourGuide';
import BottomNav from './Navigation/BottomNav';
import Header from './Header';

const Layout = ({ children }) => {
	const [isOpen, setIsOpen] = useState(false);
	const toggleSidebar = () => setIsOpen(!isOpen);

	return (
		<div className="flex min-h-screen">
			<Sidebar isOpen={isOpen} toggle={toggleSidebar} />

			{/* Header */}
			{!isOpen && <Header toggleSidebar={toggleSidebar} />}

			<div className={`w-3/5 ${isOpen ? "hidden md:flex" : "flex"} flex-col flex-grow `}>
				{/* Content */}
				<div className="flex-grow bg-gray-100 dark:bg-gray-900 p-6 mt-10 pt-10 md:mt-0 md:pt-6 xm:pb-20 overflow-y-auto">
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
