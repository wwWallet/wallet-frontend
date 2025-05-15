import React, { useState } from 'react';
import Sidebar from '../Layout/Navigation/Sidebar';
import WelcomeTourGuide from '../WelcomeTourGuide/WelcomeTourGuide';
import BottomNav from './Navigation/BottomNav';
import Header from './Header';
import Button from '../Buttons/Button';
import { faMessageDots } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Layout = ({ children }) => {
	const [isOpen, setIsOpen] = useState(false);
	const toggleSidebar = () => setIsOpen(!isOpen);

	return (
		<div className="flex justify-end min-h-dvh flex-col md:flex-row bg-c-lm-gray-100 dark:bg-c-dm-gray-900">
			<Sidebar isOpen={isOpen} toggle={toggleSidebar} />

			{/* Header */}
			{!isOpen && 
				<Header />
			}

			<div className={`w-full md:w-3/5 ${isOpen ? "hidden md:flex" : "flex"} flex-col flex-grow `}>
				{/* Content */}
				<div className="w-full flex-grow bg-c-lm-gray-100 dark:bg-c-dm-gray-900 overflow-y-auto">
					<div className='flex space-x-6 justify-end mx-6 my-4 hidden md:flex'>
						<div className='h-10' />
						
						<Button
							id="logout"
							variant="link"
							size='md'
							textSize='md'
						>
							<a href="https://github.com/wwWallet" target="_blank" rel="noreferrer">
								{"Help"}
							</a>
						</Button>
						
						<Button
							id="logout"
							variant="link"
							size='md'
							textSize='md'
						>
							<a href="https://github.com/wwWallet" target="_blank" rel="noreferrer">
								{"Docs"}
							</a>
						</Button>
					</div>

					<hr className="border-t border-c-lm-gray-400 dark:border-c-dm-gray-700 hidden md:block" />

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
