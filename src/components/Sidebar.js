import React from 'react';
import { AiOutlineLogout, AiOutlineClose, AiOutlineMenu } from "react-icons/ai";
import { FaWallet, FaUserCircle } from "react-icons/fa";
import { IoIosTime, IoIosAddCircle, IoIosSend, IoMdSettings } from "react-icons/io";
import { useLocation, useNavigate } from 'react-router-dom';

import { useApi } from '../api';
import logo from '../assets/images/wallet_white.png';
import { useLocalStorageKeystore } from '../services/LocalStorageKeystore';
import { Trans, useTranslation } from 'react-i18next';


const NavItem = ({
  children,
  handleNavigate,
  location,
  path,
}) => {
  return (
    <li
      onClick={() => handleNavigate(path)}
      className={`cursor-pointer flex items-center space-x-2 mb-4 p-2 rounded-r-xl ${
        location.pathname === path ? 'bg-white text-custom-blue' : 'nav-item-animate-hover'
      }`}
    >
      {children}
    </li>
  );
};




const Sidebar = ({ isOpen, toggle }) => {

  const api = useApi();
	const { username, displayName } = api.getSession();
	const location=useLocation();
	const navigate = useNavigate();
	const keystore = useLocalStorageKeystore();
	const { t } = useTranslation();

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
		if (window.innerWidth <= 639) {
			toggle();
	}		}
	};

	return (
		<div
			className={`${
				isOpen
					? 'w-full table fixed h-full z-50 bg-custom-blue text-white p-4'
					: ' hidden sm:table bg-custom-blue w-auto text-white h-auto py-10 px-10'
			}`}
		>
			{/* Mobile Header */}
			<div className="sm:hidden flex items-center justify-between mb-4">
				<img src={logo} alt="Logo" className="w-10 h-auto cursor-pointer" onClick={() => handleNavigate('/')} />
				<h1
					className="text-white text-xl font-bold cursor-pointer"
					onClick={() => handleNavigate('/')}
					>
					{t('common.walletName')}
				</h1>
				<button onClick={toggle}>
					{isOpen ? <AiOutlineClose size={24} /> : <AiOutlineMenu size={24} />}
				</button>
			</div>

			{/* Logo */}
			<div style={{display:'flex',flexDirection:'column'}} className="flex flex-col space-between">
				<div>
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
						  {t('common.walletName')}
						</h1>
						<button className="sm:hidden" onClick={toggle}>
							<AiOutlineClose size={30} />
						</button>
					</div>
					<hr className="my-4 border-t border-white/20" />

					{/* User */}
					<ul>
						<div className='flex items-center space-x-2 mb-4 p-2 rounded-r-xl'>
							<FaUserCircle size={30} title={displayName || username}/>
							<span
								className="text-overflow-ellipsis overflow-hidden whitespace-nowrap md:max-w-[130px]"
								title={displayName || username}
							>
								{displayName || username}
							</span>
						</div>

						<hr className="my-4 border-t border-white/20" />

						{/* Nav Menu */}
						<NavItem path="/" location={location} handleNavigate={handleNavigate}>
							<FaWallet size={30} />
							<span>{t("common.navItemCredentials")}</span>
						</NavItem>
						<NavItem path="/history" location={location} handleNavigate={handleNavigate}>
							<IoIosTime size={30} />
							<span>{t("common.navItemHistory")}</span>
						</NavItem>
						<NavItem path="/add" location={location} handleNavigate={handleNavigate}>
							<IoIosAddCircle size={30} />
							<span>{t("common.navItemAddCredentials")}</span>
						</NavItem>
						<NavItem path="/send" location={location} handleNavigate={handleNavigate}>
							<IoIosSend size={30} />
							<span>{t("common.navItemSendCredentials")}</span>
						</NavItem>
						<NavItem path="/settings" location={location} handleNavigate={handleNavigate}>
							<IoMdSettings size={30} />
							<span>{t("common.navItemSettings")}</span>
						</NavItem>

						<hr className="my-4 border-t border-white/20" />

						<li
							onClick={handleLogout}
							className={`cursor-pointer flex items-center space-x-2 mb-4 p-2 rounded-r-xl nav-item-animate-hover`}
						>
							<AiOutlineLogout size={30} />
							<span>{t("sidebar.navItemLogout")}</span>
						</li>
					</ul>
					{/* Footer */}

				</div>
			</div>
			<div className="bg-custom-blue text-white text-sm space-x-2 mb-4 p-2 table-footer-group">
				<Trans
					i18nKey ="sidebar.poweredBy"
					components={{
						docLinkWalletGithub: <a
							href="https://github.com/wwWallet" rel="noreferrer" target='blank_' className="underline"
						/>
					}}
				/>
			</div>
		</div>
	);
};

export default Sidebar;
