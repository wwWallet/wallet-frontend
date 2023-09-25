import React from 'react';
import { AiOutlineLogout, AiOutlineClose, AiOutlineMenu } from "react-icons/ai";
import { FaWallet, FaUserCircle } from "react-icons/fa";
import { IoIosTime, IoIosAddCircle, IoIosSend } from "react-icons/io";
import { useLocation, useNavigate } from 'react-router-dom';

import * as api from '../api';
import logo from '../assets/images/wallet_white.png';
import { useLocalStorageKeystore } from '../services/LocalStorageKeystore';


const NavItem = ({
	children,
	handleNavigate,
	location,
	path,
}) => {
	return (
		<li
			onClick={() => handleNavigate(path)}
			className={`cursor-pointer flex items-center space-x-2 mb-4 p-2 rounded-r-xl hover:bg-white hover:text-custom-blue ${location.pathname === path ? 'bg-white text-custom-blue' : ''
				}`}
		>
			{children}
		</li>
	);
};

const Sidebar = ({ isOpen, toggle }) => {

	const { username, displayName } = api.getSession();
	const location=useLocation();
	const navigate = useNavigate();
	const keystore = useLocalStorageKeystore();

	const handleLogout = async () => {
		api.clearSession();
		await keystore.close();
		navigate('/login');
	};

	const handleNavigate = (path) => {
		if (location.pathname === path) {
			window.location.reload();
		} else {
		navigate(path);
		// toggle(); // Close the sidebar after navigation (optional)
		}
	};

	return (
		<div
			className={`${
				isOpen
					? 'w-full fixed h-full z-50 bg-custom-blue text-white p-5'
					: ' hidden sm:block bg-custom-blue w-auto text-white h-full py-10 px-10'
			}`}
		>
			{/* Mobile Header */}
			<div className="sm:hidden flex items-center justify-between mb-4">
				<img src={logo} alt="Logo" className="w-16 h-auto cursor-pointer" onClick={() => handleNavigate('/')} />
				<h1
					className="text-white text-lg font-bold cursor-pointer"
					onClick={() => handleNavigate('/')}
					>
					eDiplomas <br />
					Digital Wallet
				</h1>
				<button onClick={toggle}>
					{isOpen ? <AiOutlineClose size={24} /> : <AiOutlineMenu size={24} />}
				</button>
			</div>

			{/* Logo */}
			<div className="flex flex-col">
				<div className="hidden sm:flex justify-between items-center mb-4">
					<img
						src={logo}
						alt="Logo"
						className="w-20 h-22 mb-2 mr-2 cursor-pointer"
						onClick={() => handleNavigate('/')}
					/>
					<h1
						className="text-white text-xl font-bold cursor-pointer"
						onClick={() => handleNavigate('/')}
						>
						wwWallet
					</h1>
					<button className="sm:hidden" onClick={toggle}>
						<AiOutlineClose size={30} />
					</button>
				</div>
				<hr className="my-4 border-t border-white/20" />

				{/* User */}
				<ul>
					<NavItem path="/account" location={location} handleNavigate={handleNavigate}>
						<FaUserCircle size={30} />
						<span>{displayName || username}</span>
					</NavItem>

					<hr className="my-4 border-t border-white/20" />

				  {/* Nav Menu */}
					<NavItem path="/" location={location} handleNavigate={handleNavigate}>
						<FaWallet size={30} />
						<span>Credentials</span>
					</NavItem>
					<NavItem path="/history" location={location} handleNavigate={handleNavigate}>
						<IoIosTime size={30} />
						<span>History</span>
					</NavItem>
					<NavItem path="/issuers" location={location} handleNavigate={handleNavigate}>
						<IoIosAddCircle size={30} />
						<span>Issuers</span>
					</NavItem>
					<NavItem path="/verifiers" location={location} handleNavigate={handleNavigate}>
						<IoIosSend size={30} />
						<span>Verifiers</span>
					</NavItem>

					<hr className="my-4 border-t border-white/20" />

					<li
						onClick={handleLogout}
						className={`cursor-pointer flex items-center space-x-2 mb-4 p-2 rounded-r-xl hover:bg-light-red hover:text-custom-blue `}
					>
						<AiOutlineLogout size={30} />
						<span>Logout</span>
					</li>
				</ul>
				{/* Footer */}
			</div>
			<div className="absolute bottom-0 bg-custom-blue text-white text-sm space-x-2 mb-4 p-2">
				Powered by{' '}
				<a href="https://www.wwwallet.org/" rel="noreferrer" target="_blank" className="underline">
					wwWallet
				</a>
			</div>
		</div>
	);
};

export default Sidebar;
