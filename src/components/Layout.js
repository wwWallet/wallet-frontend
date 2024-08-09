import React, { useState, useEffect, useContext, useRef } from 'react';
import Sidebar from './Sidebar';
import { AiOutlineMenu } from "react-icons/ai";
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import logo from '../assets/images/wallet_white.png';
import { useLocation, useNavigate } from 'react-router-dom';
import WelcomeTourGuide from './WelcomeTourGuide/WelcomeTourGuide';
import { CSSTransition } from 'react-transition-group';
import { useSessionStorage } from '../components/useStorage';
import { Trans, useTranslation } from 'react-i18next';
import { useApi } from '../api';
import BottomNav from './BottomNav';
import OnlineStatusContext from '../context/OnlineStatusContext';
import ConnectivityBars from '../components/Connectivity/ConnectivityBars';

const Layout = ({ children, isPermissionGranted, tokenSentInSession }) => {
	const { isOnline, connectivityQuality } = useContext(OnlineStatusContext);
	const location = useLocation();
	const navigate = useNavigate();
	const [isContentVisible, setIsContentVisible] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const toggleSidebar = () => setIsOpen(!isOpen);
	const api = useApi();
	const [isMessageNoGrantedVisible, setIsMessageNoGrantedVisible,] = api.useClearOnClearSession(useSessionStorage('isMessageNoGrantedVisible', false));
	const [isMessageGrantedVisible, setIsMessageGrantedVisible,] = api.useClearOnClearSession(useSessionStorage('isMessageGrantedVisible', false));
	const [isMessageOfflineVisible, setIsMessageOfflineVisible,] = api.useClearOnClearSession(useSessionStorage('isMessageOfflineVisible', false));
	const { t } = useTranslation();
	const nodeRef = useRef(null);

	const handleNavigate = (path) => {
		if (location.pathname === path) {
			window.location.reload();
		} else {
			navigate(path);
		}
	};

	const handleCloseMessageOffline = () => {
		setIsMessageOfflineVisible(true);
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
				className={`${isOpen ? 'hidden' : 'z-50 fixed top-0 left-0 w-full bg-primary dark:bg-primary-hover text-white flex items-center justify-between p-4 shadow-md sm:hidden rounded-b-lg'}`}
			>
				<ConnectivityBars
					quality={isOnline ? connectivityQuality : 0}
				/>
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

					{((isOnline === false && isMessageOfflineVisible === false)) || (isOnline === true && isPermissionGranted != null && ((!isPermissionGranted && isMessageNoGrantedVisible === false) || (isPermissionGranted && tokenSentInSession === false && isMessageGrantedVisible === false))) ? (
						<div className="bg-orange-100 shadow-lg p-4 rounded-lg mb-4 flex items-center">
							<div className="mr-4 text-orange-500">
								<FaExclamationTriangle size={24} />
							</div>

							{isOnline === false && isMessageOfflineVisible === false && (
								<>
									<div className="flex-grow">
										<p className='text-sm'>
											<Trans
												i18nKey="layout.messageOffline"
												components={{ strong: <strong /> }}
											/>
										</p>
									</div>
									<button
										className="ml-2 text-gray-800"
										onClick={handleCloseMessageOffline}
									>
										<FaTimes size={24} />
									</button>
								</>
							)}
							{isOnline === true && (
								<>
									{!isPermissionGranted && (
										<>
											<div className="flex-grow">
												<p className='text-sm'>
													<Trans
														i18nKey="layout.messageAllowPermission"
														components={{ strong: <strong /> }}
													/>
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
									{isPermissionGranted && tokenSentInSession === false && (
										<>
											<div className="flex-grow">
												<p className='text-sm'>
													<Trans
														i18nKey="layout.messageResetPermission"
														components={{
															strong: <strong />,
															reloadButton: <button className='text-primary underline' onClick={() => window.location.reload()} />,
														}}
													/>
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
						nodeRef={nodeRef}
					>
						<div ref={nodeRef}>
							{children}
						</div>
					</CSSTransition>
				</div>
			</div>

			{/* Bottom Nav menu */}
			<BottomNav isOpen={isOpen} toggle={toggleSidebar} />
			<WelcomeTourGuide toggleMenu={toggleSidebar} isOpen={isOpen} />
		</div>
	);
};

export default Layout;
