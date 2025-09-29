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
import CredentialsContext from '@/context/CredentialsContext';
import CounterBadge from '@/components/Shared/CounterBadge';

const NavItem = ({ icon: Icon, id, label, handleNavigate, location, path, alias, counter, notificationIcon, className = '' }) => {
	const isActive = location.pathname === path || location.pathname === alias;

	return (
		<button
			id={`sidebar-item-${id}`}
			onClick={() => handleNavigate(path)}
			className={`cursor-pointer flex items-center justify-between space-x-2 mb-4 p-2 rounded-r-xl w-full ${isActive ? 'bg-white text-primary' : 'nav-item-animate-hover'} ${className}`}
		>
			<div className="flex items-center space-x-2 text-left">
				{Icon && <Icon className="shrink-0" size={30} />}
				<span>
					{label}
				</span>
			</div>
			{(notificationIcon || typeof counter === 'number') && (
				<div className="relative flex items-center gap-2">
					{notificationIcon}
					<CounterBadge count={counter} active={isActive} ariaLabel="pending" />
				</div>
			)}
		</button>
	);
};

const Sidebar = ({ isOpen, toggle }) => {
	const { updateAvailable } = useContext(StatusContext);
	const { api, logout } = useContext(SessionContext);
	const { pendingTransactions } = useContext(CredentialsContext);
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
				? 'w-full flex flex-col justify-between fixed h-dvh z-30 bg-primary-dark dark:bg-primary-dark-hover text-white p-4 pb-24 md:pb-0 overflow-y-auto'
				: 'hidden w-64 md:flex md:flex-col justify-between sticky top-0 bg-primary-dark dark:bg-primary-dark-hover text-white h-dvh py-8 px-7 overflow-y-auto'
				}`}
		>
			{/* Header and Nav */}
			<div style={{ display: 'flex', flexDirection: 'column' }} className="flex flex-col space-between">
				<div className="md:hidden flex items-center justify-between mb-4">
					<div className='flex items-center'>
						<Logo type='white' aClassName='mr-2' imgClassName='w-10 h-auto' />
						<a href={('/')}
							className="text-white text-xl font-bold cursor-pointer"
						>
							{t('common.walletName')}
						</a>
					</div>
				</div>
				<div>
					<div className="hidden md:flex md:gap-2 justify-between items-center">
						<Logo type='white' aClassName='mb-2 mr-2 w-5/12' imgClassName='object-contain' />
						<a href={('/')}
							className="text-white text-xl font-bold cursor-pointer w-7/12"
						>
							{t('common.walletName')}
						</a>
					</div>

					<hr className="my-2 border-t border-white/20" />

					{/* User */}
					<ul>
						<div className='flex items-center space-x-2 mb-2 p-2 rounded-r-xl'>
							<div className='pr-2 border-r border-white/20'>
								<ConnectionStatusIcon size='small' />
							</div>

							<FaUserCircle className="shrink-0" size={20} title={displayName || username} />
							<span
								className="text-overflow-ellipsis text-sm overflow-hidden whitespace-nowrap"
								title={displayName || username}
							>
								{displayName || username}
							</span>
						</div>

						<hr className="my-2 border-t border-white/20" />

						{/* Nav Menu */}
						<NavItem
							id="credentials"
							path="/"
							alias="/cb"
							location={location}
							handleNavigate={handleNavigate}
							icon={FaWallet}
							label={t("common.navItemCredentials")}
							className="step-2 hidden md:flex"
							counter={pendingTransactions?.length ?? undefined}
						/>

						<NavItem
							id="add"
							path="/add"
							location={location}
							handleNavigate={handleNavigate}
							icon={IoIosAddCircle}
							label={t("common.navItemAddCredentials")}
							className="step-3 hidden md:flex"
						/>

						<NavItem
							id="send"
							path="/send"
							location={location}
							handleNavigate={handleNavigate}
							icon={IoIosSend}
							label={t("common.navItemSendCredentials")}
							className="step-5 hidden md:flex"
						/>

						<NavItem
							id="history"
							path="/history"
							location={location}
							handleNavigate={handleNavigate}
							icon={IoIosTime}
							label={t("common.navItemHistory")}
							className="step-6"
						/>

						<NavItem
							id="settings"
							path="/settings"
							location={location}
							handleNavigate={handleNavigate}
							icon={IoMdSettings}
							label={t("common.navItemSettings")}
							notificationIcon={
								updateAvailable && (
									<MdNotifications size={22} className="text-green-500" />
								)
							}
							className="step-7"
						/>

						<hr className="my-2 border-t border-white/20" />

						<button
							id="sidebar-item-logout"
							onClick={handleLogout}
							className={`cursor-pointer flex items-center space-x-2 mb-4 p-2 rounded-r-xl nav-item-animate-hover w-full`}
						>
							<AiOutlineLogout size={30} />
							<span className='text-left'>
								{t("sidebar.navItemLogout")}
							</span>
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
