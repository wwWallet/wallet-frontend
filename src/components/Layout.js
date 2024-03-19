import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { GiHamburgerMenu } from 'react-icons/gi';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import logo from '../assets/images/wallet_white.png';
import { useLocation, useNavigate } from 'react-router-dom';
import { CSSTransition } from 'react-transition-group';
import { useSessionStorage } from '../components/useStorage';
import { useTranslation } from 'react-i18next';

const Layout = ({ children, isPermissionGranted, tokenSentInSession }) => {
	const location = useLocation();
	const navigate = useNavigate();
	const [isContentVisible, setIsContentVisible] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const toggleSidebar = () => setIsOpen(!isOpen);
	const [isMessageNoGrantedVisible, setIsMessageNoGrantedVisible] = useSessionStorage('isMessageNoGrantedVisible', null);
	const [isMessageGrantedVisible, setIsMessageGrantedVisible] = useSessionStorage('isMessageGrantedVisible', null);
	const { t } = useTranslation();

	const handleNavigate = (path) => {
		if (location.pathname === path) {
			window.location.reload();
		} else {
			navigate(path);
		}
	};

	const handleCloseMessageNoGranted = () => {
		setIsMessageNoGrantedVisible(true);
	};

	const handleCloseMessageGranted = () => {
		setIsMessageGrantedVisible(true);
	};

	useEffect(() => {
		setIsContentVisible(false);
		const timer = setTimeout(() => {
			setIsContentVisible(true);
		}, 0);
		return () => clearTimeout(timer);
	}, [location.pathname]); // Only runs when location.pathname changes

	return (
		<div className="flex min-h-screen">
			<Sidebar isOpen={isOpen} toggle={toggleSidebar} />

			{/* Header */}
			<header
				className={`${isOpen ? 'hidden' : 'z-50 fixed top-0 left-0 w-full bg-custom-blue text-white flex items-center justify-between p-4 sm:hidden'}`}
			>
				<div className="flex items-center">
					<img
						src={logo}
						alt="Logo"
						className="w-10 h-auto mr-2 cursor-pointer"
						onClick={() => handleNavigate('/')}
					/>
				</div>
				<h1
					className="text-white text-xl font-bold cursor-pointer"
					onClick={() => handleNavigate('/')}
				>
					wwWallet
				</h1>
				<button className="text-white" onClick={toggleSidebar}>
					<GiHamburgerMenu size={24} />
				</button>
			</header>

			<div className="w-3/5 flex flex-col flex-grow">
				{/* Sidebar */}
				<div
					className={`sticky top-0 h-screen overflow-y-auto bg-custom-blue text-white p-6 sm:w-64 ${isOpen ? 'block' : 'hidden'
						}`}
				>
					<Sidebar isOpen={isOpen} toggle={toggleSidebar} />
				</div>

				{/* Content */}
				<div className="flex-grow bg-gray-100 p-6 mt-10 pt-10 sm:mt-0 sm:pt-6 overflow-y-auto">
					{/* Conditional Notification Message */}
					{(!isPermissionGranted && !isMessageNoGrantedVisible) || (isPermissionGranted && tokenSentInSession !== 'true' && !isMessageGrantedVisible) ? (
						<div className="bg-orange-100 shadow-lg p-4 rounded-lg mb-4 flex items-center">
							<div className="mr-4 text-orange-500">
								<FaExclamationTriangle size={24} />
							</div>
							{!isPermissionGranted && (
								<>
									<div className="flex-grow">
										<p className='text-sm'>
											{t('layout.messageAllowPermissionPart1')}
											<strong>{
												t('layout.messageAllowPermissionPart2')}
											</strong>
											.
										</p>
									</div>
									<button
										className="ml-2 text-gray-800"
										onClick={handleCloseMessageNoGranted}
									>
										<FaTimes size={24} />
									</button>
								</>
							)}
							{isPermissionGranted && tokenSentInSession !== 'true' && (
								<>
									<div className="flex-grow">
										<p className='text-sm'>
											{t('layout.messageResetPermissionPart1')}
											<strong>
												{t('layout.messageResetPermissionPart2')}
											</strong>
											{t('layout.messageResetPermissionPart3')}
											<strong>
												{t('layout.messageResetPermissionPart4')}
											</strong>
											.
										</p>
									</div>
									<button
										className="ml-2 text-gray-800"
										onClick={handleCloseMessageGranted}
									>
										<FaTimes size={24} />
									</button>
								</>
							)}

						</div>
					) : (
						<></>
					)}
					<CSSTransition
						in={isContentVisible}
						timeout={400}
						classNames="content-fade-in"
						appear
						key={location.pathname}
					>
						{children}
					</CSSTransition>
				</div>
			</div>
		</div>
	);
};

export default Layout;
