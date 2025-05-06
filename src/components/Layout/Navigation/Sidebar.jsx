import React, { useContext } from 'react';
import { AiOutlineLogout } from "react-icons/ai";
import { FaWallet, FaUserCircle } from "react-icons/fa";
import { IoIosTime, IoIosAddCircle, IoIosSend, IoMdSettings } from "react-icons/io";
import { useLocation, useNavigate } from 'react-router-dom';
import useScreenType from '../../../hooks/useScreenType';
import Logo from '../../Logo/Logo';
import { Trans, useTranslation } from 'react-i18next';
import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';
import { MdNotifications } from "react-icons/md";
import ConnectionStatusIcon from './ConnectionStatusIcon';
import Button from '@/components/Buttons/Button';
import { faArrowRightFromBracket, faCirclePlus, faGear, faHistory, faKey, faSend, faUserCircle } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const NavItem = ({ icon, id, label, handleNavigate, location, path, alias, notificationIcon, className = '' }) => {
	const isActive = location.pathname === path || location.pathname === alias;
	return (
		<button
			id={`sidebar-item-${id}`}
			onClick={() => handleNavigate(path)}
			className={`
				cursor-pointer flex items-center justify-between space-x-2 mb-1 py-2.5 px-3 rounded-lg w-full font-medium
				text-c-lm-gray-900 dark:text-c-dm-gray-100 ${isActive ? 'bg-c-lm-gray-300 dark:bg-c-dm-gray-700' : 'bg-transparent hover:bg-c-lm-gray-300 dark:hover:bg-c-dm-gray-700'} 
				transition-all duration-150
				${className}
			`}
		>
			<div className="flex items-center text-left">
				{icon && <FontAwesomeIcon icon={icon} className="text-md mr-3" fixedWidth />}

				<span>
					{label}
				</span>
			</div>

			{notificationIcon && (
				<div className="flex items-center">
					{notificationIcon}
				</div>
			)}
		</button>
	);
};

const Sidebar = ({ isOpen, toggle }) => {
	const { updateAvailable } = useContext(StatusContext);
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
			className={
				isOpen && screenType !== 'desktop' ? 
					'w-full flex flex-col justify-between fixed h-dvh z-30 bg-primary dark:bg-primary-hover text-white p-4 pb-24 md:pb-0 overflow-y-auto'
				: 
					'hidden w-64 md:flex md:flex-col justify-between sticky top-0 bg-c-lm-gray-200 dark:bg-c-dm-gray-900 dark:border-r dark:border-c-dm-gray-700 text-c-lm-gray-900 dark:text-c-dm-gray-100 h-dvh px-4 overflow-y-auto'
			}
		>
			{/* Header and Nav */}
			<div style={{ display: 'flex', flexDirection: 'column' }} className="flex flex-col space-between">
				<div className="md:hidden flex items-center justify-between mb-4">
					<div className='flex items-center'>
						<Logo aClassName='mr-2' imgClassName='w-8 h-8' />

						<a href={('/')}
							className="text-white text-xl font-semibold cursor-pointer"
						>
							{t('common.walletName')}
						</a>
					</div>
				</div>

				<div>
					<div className="hidden md:flex justify-center items-center my-5">
						<a 
						href={('/')}
						className="w-full"
						>
							<Logo 
							imgClassName='w-full h-8 object-contain' 
							isWordmark={true}
							/>
						</a>
					</div>

					<hr className="mb-4 border-t border-c-lm-gray-400 dark:border-c-dm-gray-700 -mx-4" />

					{/* User */}
					<ul>
						{/* Nav Menu */}
						<NavItem
							id="credentials"
							path="/"
							alias="/cb"
							location={location}
							handleNavigate={handleNavigate}
							icon={faKey}
							label={t("common.navItemCredentials")}
							className="step-2 hidden md:block"
						/>

						<NavItem
							id="add"
							path="/add"
							location={location}
							handleNavigate={handleNavigate}
							icon={faCirclePlus}
							label={t("common.navItemAddCredentials")}
							className="step-3 hidden md:block"
						/>

						<NavItem
							id="send"
							path="/send"
							location={location}
							handleNavigate={handleNavigate}
							icon={faSend}
							label={t("common.navItemSendCredentials")}
							className="step-5 hidden md:block"
						/>

						<NavItem
							id="history"
							path="/history"
							location={location}
							handleNavigate={handleNavigate}
							icon={faHistory}
							label={t("common.navItemHistory")}
							className="step-6"
						/>

						<hr className="my-2 border-t border-c-lm-gray-400 dark:border-c-dm-gray-700 mx-3" />

						<NavItem
							id="settings"
							path="/settings"
							location={location}
							handleNavigate={handleNavigate}
							icon={faGear}
							label={t("common.navItemSettings")}
							notificationIcon={
								updateAvailable && (
									<MdNotifications size={22} className="text-green-500" />
								)
							}
							className="step-7"
						/>

						<button
							id="sidebar-item-logout"
							onClick={handleLogout}
							className={`
								cursor-pointer flex items-center px-3 py-2.5 rounded-lg w-full
								text-c-lm-gray-900 dark:text-c-dm-gray-100 text-md font-medium
								bg-transparent hover:bg-c-lm-gray-300 dark:hover:bg-c-dm-gray-700
								transition-all duration-150
							`}
						>
							<FontAwesomeIcon icon={faArrowRightFromBracket} className='text-md mr-3' fixedWidth />

							<span className='text-left'>
								{t("sidebar.navItemLogout")}
							</span>
						</button>

					</ul>
				</div>
			</div>

			<div className='mt-8'>
				<div 
				className={`
					flex items-center mb-2 px-3 py-2.5 rounded-lg bg-c-lm-gray-300 dark:bg-c-dm-gray-800 mb-4
				`}
				>
					<FontAwesomeIcon icon={faUserCircle} className="mr-3 text-md" />

					<span
						className="text-overflow-ellipsis text-md font-medium overflow-hidden whitespace-nowrap"
						title={displayName || username}
					>
						{displayName || username}
					</span>
				</div>

				{/* Powered By */}
				<div className="text-c-lm-gray-700 dark:text-c-dm-gray-300 text-sm text-center mb-6">
					<Trans
						i18nKey="sidebar.poweredBy"
						components={{
							docLinkWalletGithub: (
								<a
									href="https://github.com/wwWallet"
									rel="noreferrer"
									target="_blank"
									aria-label={t('sidebar.poweredbyAriaLabel')}
								/>
							),
							docBtn: (
								<Button
									variant="link"
								/>
							)
						}}
					/>
				</div>
			</div>
		</div>
	);
};

export default Sidebar;
