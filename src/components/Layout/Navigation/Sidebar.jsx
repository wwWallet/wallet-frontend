import React, { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useScreenType from '../../../hooks/useScreenType';
import Logo from '../../Logo/Logo';
import { Trans, useTranslation } from 'react-i18next';
import StatusContext from '@/context/StatusContext';
import SessionContext from '@/context/SessionContext';
import ConnectionStatusIcon from './ConnectionStatusIcon';
import CredentialsContext from '@/context/CredentialsContext';
import CounterBadge from '@/components/Shared/CounterBadge';
import { Bell, History, LogOut, PlusCircle, Send, Settings, ShieldHalf, UserCircle, Wallet } from 'lucide-react';

const NavItem = ({ icon: Icon, id, label, handleNavigate, location, path, alias, counter, notificationIcon, className = '' }) => {
	const isActive = location.pathname === path || location.pathname === alias;

	return (
		<button
			id={`sidebar-item-${id}`}
			onClick={() => handleNavigate(path)}
			className={`relative cursor-pointer flex items-center justify-between space-x-2 mb-2 p-2 rounded-lg w-full hover:bg-lm-gray-500 dark:hover:bg-dm-gray-500 ${isActive ? 'bg-lm-gray-400 dark:bg-dm-gray-600' : 'transition-colors'} ${className}`}
		>
			{isActive && (
				<div role="presentation" className="absolute left-[-8px] top-[50%] h-[90%] translate-y-[-50%] w-1 rounded-sm bg-brand-base dark:bg-brand-light"></div>
			)}
			<div className="flex items-center space-x-2 text-left">
				{Icon && <Icon className="shrink-0 m-1" size={20} />}
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
	const { api, logout, obliviousKeyConfig } = useContext(SessionContext);
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
				? 'w-full flex flex-col justify-between fixed h-dvh z-30 bg-primary-dark dark:bg-primary-dark-hover  p-4 pb-24 md:pb-0 overflow-y-auto'
				: 'hidden w-64 md:flex md:flex-col justify-between sticky top-0 bg-primary-dark dark:bg-primary-dark-hover  h-dvh py-8 px-8 overflow-y-auto border-r border-r-lm-gray-400 dark:border-r-dm-gray-600'
				}`}
		>
			{/* Header and Nav */}
			<div style={{ display: 'flex', flexDirection: 'column' }} className="flex flex-col space-between">
				<div className="md:hidden flex items-center justify-between mb-4">
					<div className='flex items-center'>
						<Logo aClassName='mr-2' imgClassName='w-10 h-auto' />
						<a href={('/')}
							className=" text-xl font-bold cursor-pointer"
						>
							{t('common.walletName')}
						</a>
					</div>
				</div>
				<div>
					<div className="hidden md:flex md:gap-4 justify-between items-center mb-4">
						<Logo aClassName='w-4/12' imgClassName='object-contain' />
						<a href={('/')}
							className=" text-xl font-bold cursor-pointer w-8/12"
						>
							{t('common.walletName')}
						</a>
					</div>

					<hr className="my-2 border-t border-lm-gray-400 dark:border-dm-gray-600" />

					{/* User */}
					<ul>
						<div className='flex items-center space-x-2 mb-2 p-2 rounded-r-xl'>
							<div className='pr-2 border-r border-r-lm-gray-400 dark:border-r-dm-gray-600'>
								<ConnectionStatusIcon size='small' />
							</div>
							{ obliviousKeyConfig !== null && (
								<ShieldHalf size={28} className="shrink-0 pr-2 border-r border-lm-gray-400 dark:border-dm-gray-600" title={t('sidebar.obliviousEnabled')}/>
							)}

							<UserCircle className="shrink-0" size={20} title={displayName || username} />
							<span
								className="text-overflow-ellipsis text-sm overflow-hidden whitespace-nowrap"
								title={displayName || username}
							>
								{displayName || username}
							</span>
						</div>

						<hr className="my-2 border-t border-lm-gray-400 dark:border-dm-gray-600" />

						{/* Nav Menu */}
						<NavItem
							id="credentials"
							path="/"
							alias="/cb"
							location={location}
							handleNavigate={handleNavigate}
							icon={Wallet}
							label={t("common.navItemCredentials")}
							className="step-2 hidden md:flex"
							counter={pendingTransactions?.length ?? undefined}
						/>

						<NavItem
							id="add"
							path="/add"
							location={location}
							handleNavigate={handleNavigate}
							icon={PlusCircle}
							label={t("common.navItemAddCredentials")}
							className="step-3 hidden md:flex"
						/>

						<NavItem
							id="send"
							path="/send"
							location={location}
							handleNavigate={handleNavigate}
							icon={Send}
							label={t("common.navItemSendCredentials")}
							className="step-5 hidden md:flex"
						/>

						<NavItem
							id="history"
							path="/history"
							location={location}
							handleNavigate={handleNavigate}
							icon={History}
							label={t("common.navItemHistory")}
							className="step-6"
						/>

						<NavItem
							id="settings"
							path="/settings"
							location={location}
							handleNavigate={handleNavigate}
							icon={Settings}
							label={t("common.navItemSettings")}
							notificationIcon={
								updateAvailable && (
									<Bell size={22} className="text-lm-green dark:text-dm-green" />
								)
							}
							className="step-7"
						/>

						<hr className="my-2 border-t border-lm-gray-400 dark:border-dm-gray-600" />

						<button
							id="sidebar-item-logout"
							onClick={handleLogout}
							className={`cursor-pointer flex items-center space-x-2 mb-4 p-2 rounded-lg hover:bg-lm-gray-400 dark:hover:bg-dm-gray-500 transition-colors w-full`}
						>
							<LogOut size={20} className="m-1" />
							<span className='text-left'>
								{t("sidebar.navItemLogout")}
							</span>
						</button>
					</ul>
				</div>
			</div>

			{/* Powered By */}
			<div className=" text-sm space-x-2 p-2">
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
