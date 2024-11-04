import React, { useContext } from 'react';
import { AiOutlineLogout } from "react-icons/ai";
import { FaWallet, FaUserCircle } from "react-icons/fa";
import { IoIosTime, IoIosAddCircle, IoIosSend, IoMdSettings } from "react-icons/io";
import { useLocation, useNavigate } from 'react-router-dom';
import useScreenType from '../../../hooks/useScreenType';
import logo from '../../../assets/images/wallet_white.png';
import { Trans, useTranslation } from 'react-i18next';
import StatusContext from '../../../context/StatusContext';
import SessionContext from '../../../context/SessionContext';
import { MdNotifications } from "react-icons/md";
import ConnectionStatusIcon from './ConnectionStatusIcon';

const NavItem = ({
	children,
	handleNavigate,
	location,
	path,
	alias,
}) => {
	const isActive = location.pathname === path || location.pathname === alias;
	return (
		<button
			onClick={() => handleNavigate(path)}
			className={`cursor-pointer flex items-center space-x-2 mb-4 p-2 rounded-r-xl w-full ${isActive ? 'bg-white text-primary' : 'nav-item-animate-hover'}`}
		>
			{children}
		</button>
	);
};

const Sidebar = ({ isOpen, toggle }) => {
	const { isOnline, updateAvailable } = useContext(StatusContext);
	const { api, logout } = useContext(SessionContext);
	const { username, displayName } = api.getSession();
	const location = useLocation();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const screenType = useScreenType();

	const handleLogout = async () => {
		await logout();
	};

	const handleNavigate = (path) => {
		if (location.pathname === path) {
			window.location.reload();
		} else {
			navigate(path);
			if (screenType !== 'desktop') {
				toggle();
			}
		}
	};

	return (
		<div
			className={`${isOpen && screenType !== 'desktop'
				? 'w-full flex flex-col justify-between fixed h-screen z-30 bg-primary dark:bg-primary-hover text-white p-4 pb-24 md:pb-0 overflow-y-auto'
				: 'hidden w-auto md:flex md:flex-col justify-between sticky top-0 bg-primary dark:bg-primary-hover w-auto text-white h-screen py-10 px-10 overflow-y-auto'

				}`}
		>
			{/* Header and Nav */}
			<div style={{ display: 'flex', flexDirection: 'column' }} className="flex flex-col space-between">
				<div className="md:hidden flex items-center justify-between mb-4">
					<div className='flex items-center'>
						<button className='mr-2' onClick={() => handleNavigate('/')}>
							<img src={logo} alt="Logo" className="w-10 h-auto cursor-pointer" />
						</button>
						<a href={('/')}
							className="text-white text-xl font-bold cursor-pointer"
						>
							{t('common.walletName')}
						</a>
					</div>
				</div>
				<div>
					<div className="hidden md:flex justify-between items-center">
						<button className='mb-2 mr-2' onClick={() => handleNavigate('/')}>
							<img
								src={logo}
								alt="Logo"
								className="w-20 h-22 cursor-pointer"
							/>
						</button>
						<a href={('/')}
							className="text-white text-xl font-bold cursor-pointer"
						>
							{t('common.walletName')}
						</a>
					</div>

					<hr className="my-2 border-t border-white/20" />

					{/* User */}
					<ul>
						<div className='flex items-center space-x-2 mb-2 p-2 rounded-r-xl'>
							<div className='pr-2 border-r border-white/20'>
								<ConnectionStatusIcon size={22} />
							</div>

							<FaUserCircle size={20} title={displayName || username} />
							<span
								className="text-overflow-ellipsis text-sm overflow-hidden whitespace-nowrap md:max-w-[95px]"
								title={displayName || username}
							>
								{displayName || username}
							</span>
						</div>

						<hr className="my-2 border-t border-white/20" />

						{/* Nav Menu */}
						<div className='step-2 hidden md:block'>
							<NavItem path="/" alias="/cb" location={location} handleNavigate={handleNavigate}>
								<FaWallet size={30} />
								<span>{t("common.navItemCredentials")}</span>
							</NavItem>
						</div>
						<div className='step-3 hidden md:block'>
							<NavItem path="/add" location={location} handleNavigate={handleNavigate}>
								<IoIosAddCircle size={30} />
								<span>{t("common.navItemAddCredentials")}</span>
							</NavItem>
						</div>
						<div className='step-5 hidden md:block'>
							<NavItem path="/send" location={location} handleNavigate={handleNavigate}>
								<IoIosSend size={30} />
								<span>{t("common.navItemSendCredentials")}</span>
							</NavItem>
						</div>
						<div className='step-6'>
							<NavItem path="/history" location={location} handleNavigate={handleNavigate}>
								<IoIosTime size={30} />
								<span>{t("common.navItemHistory")}</span>
							</NavItem>
						</div>
						<div className='step-7'>
							<NavItem path="/settings" location={location} handleNavigate={handleNavigate}>
								<IoMdSettings size={30} />
								<div className='flex gap-2 items-center'>
									<span>{t("common.navItemSettings")}</span>
									{updateAvailable && (
										<MdNotifications
											size={22}
											className="text-green-500"
										/>
									)}
								</div>
							</NavItem>
						</div>

						<hr className="my-2 border-t border-white/20" />

						<button
							onClick={handleLogout}
							className={`cursor-pointer flex items-center space-x-2 mb-4 p-2 rounded-r-xl nav-item-animate-hover w-full`}
						>
							<AiOutlineLogout size={30} />
							<span>{t("sidebar.navItemLogout")}</span>
						</button>
					</ul>
				</div>
			</div>

			{/* Powered By */}
			<div className="text-white text-sm space-x-2 p-2">
				<Trans
					i18nKey="sidebar.poweredBy"
					components={{
						docLinkWalletGithub: <a
							href="https://github.com/wwWallet"
							rel="noreferrer"
							target='blank_'
							className="underline"
							aria-label={t('sidebar.poweredbyAriaLabel')}
						/>
					}}
				/>
			</div>
		</div>
	);
};

export default Sidebar;
