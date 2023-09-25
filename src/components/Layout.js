import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { GiHamburgerMenu } from 'react-icons/gi';
import logo from '../assets/images/wallet_white.png';
import { useLocation, useNavigate } from 'react-router-dom';

const Layout = ({ children }) => {
	const location=useLocation();
	const navigate = useNavigate();

	const [isOpen, setIsOpen] = useState(false);

	const toggleSidebar = () => setIsOpen(!isOpen);

	const handleNavigate = (path) => {
		if (location.pathname === path) {
			window.location.reload();
		} else {
		navigate(path);
		// toggle(); // Close the sidebar after navigation (optional)
		}
	};

	return (
		<div className="flex h-screen">
			<Sidebar isOpen={isOpen} toggle={toggleSidebar} />

			{/* Header */}
			<header className={`${isOpen ? 'hidden' : 'z-50 fixed top-0 left-0 w-full bg-custom-blue text-white flex items-center justify-between p-4 sm:hidden'}`}>
				<div className="flex items-center">
					<img src={logo} alt="Logo" className="w-10 h-auto mr-2 cursor-pointer" onClick={() => handleNavigate('/')}/>
				</div>
				<h1 className="text-white text-xl font-bold cursor-pointer" onClick={() => handleNavigate('/')} >wwWallet</h1>
				<button className="text-white" onClick={toggleSidebar}>
					<GiHamburgerMenu size={24} />
				</button>
			</header>

			<div className="w-3/5 flex flex-col flex-grow">
				{/* Sidebar */}
				<div className={`sticky top-0 h-screen overflow-y-auto bg-custom-blue text-white p-6 sm:w-64 ${isOpen ? 'block' : 'hidden'}`}>
					<Sidebar isOpen={isOpen} toggle={toggleSidebar} />
				</div>

				{/* Content */}
				<div className="flex-grow bg-gray-100 p-6 mt-10 pt-10 sm:mt-0 sm:pt-6 overflow-y-auto">
					{children}
				</div>
			</div>
		</div>
	);
};

export default Layout;
