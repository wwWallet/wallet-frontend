import React from 'react';
import { AiOutlineLogout, AiOutlineClose, AiOutlineMenu } from "react-icons/ai";
import { FaWallet, FaUserCircle } from "react-icons/fa";
import { IoIosTime, IoIosAddCircle, IoIosSend } from "react-icons/io";
import { useLocation, useNavigate } from 'react-router-dom';

import * as api from '../api';
import logo from '../assets/images/ediplomasLogo.svg';
import { useLocalStorageKeystore } from '../services/LocalStorageKeystore';

const Sidebar = ({ isOpen, toggle }) => {

	const { username } = api.getSession();
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
						className="w-22 h-22 mb-2 mr-2 cursor-pointer"
						onClick={() => handleNavigate('/')}
					/>
					<h1
						className="text-white text-lg font-bold cursor-pointer"
						onClick={() => handleNavigate('/')}
						>
						eDiplomas <br />
						Digital Wallet
					</h1>
					<button className="sm:hidden" onClick={toggle}>
						<AiOutlineClose size={30} />
					</button>
				</div>
				<hr className="my-4 border-t border-white/20" />

				{/* User */}
				<div className="px-2 flex items-center mt-2 mb-2">
					<FaUserCircle size={30} className="mr-2" />
					<span className="text-white">{username}</span>
				</div>
				<hr className="my-4 border-t border-white/20" />

				{/* Nav Menu */}
				<ul>
					<li
						onClick={() => handleNavigate('/')}
						className={`cursor-pointer flex items-center space-x-2 mb-4 p-2 rounded-r-xl hover:bg-white hover:text-custom-blue ${
							location.pathname === '/' ? 'bg-white text-custom-blue' : ''
						}`}
					>
						<FaWallet size={30} />
						<span>Credentials</span>
					</li>
					<li
						onClick={() => handleNavigate('/history')}
						className={`cursor-pointer flex items-center space-x-2 mb-4 p-2 rounded-r-xl hover:bg-white hover:text-custom-blue ${
							location.pathname === '/history' ? 'bg-white text-custom-blue' : ''
						}`}
					>
						<IoIosTime size={30} />
						<span>History</span>
					</li>
					<li
						onClick={() => handleNavigate('/issuers')}
						className={`cursor-pointer flex items-center space-x-2 mb-4 p-2 rounded-r-xl hover:bg-white hover:text-custom-blue ${
							location.pathname === '/issuers' ? 'bg-white text-custom-blue' : ''
						}`}
					>
						<IoIosAddCircle size={30} />
						<span>Issuers</span>
					</li>
					<li
						onClick={() => handleNavigate('/verifiers')}
						className={`cursor-pointer flex items-center space-x-2 mb-4 p-2 rounded-r-xl hover:bg-white hover:text-custom-blue ${
							location.pathname === '/verifiers' ? 'bg-white text-custom-blue' : ''
						}`}
					>
						<IoIosSend size={30} />
						<span>Verifiers</span>
					</li>
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
				<a href="https://www.gunet.gr/" rel="noreferrer" target="_blank" className="underline">
					GUnet
				</a>
			</div>
		</div>
	);
};

export default Sidebar;
