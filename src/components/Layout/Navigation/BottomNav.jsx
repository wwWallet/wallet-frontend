import React, { useContext } from 'react';
import { FaWallet, FaUserCircle } from "react-icons/fa";
import { IoIosAddCircle, IoIosSend } from "react-icons/io";
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MdNotifications } from "react-icons/md";
import StatusContext from '../../../context/StatusContext';
import { BsQrCodeScan } from 'react-icons/bs';
import { useQRScanner } from '../../../hooks/useQRScanner';
import QRCodeScanner from '../../QRCodeScanner/QRCodeScanner';

const BottomNav = ({ isOpen, toggle }) => {
	const { updateAvailable } = useContext(StatusContext);
	const { isQRScannerOpen, openQRScanner, closeQRScanner } = useQRScanner();
	const location = useLocation();
	const navigate = useNavigate();
	const { t } = useTranslation();

	const navItems = [
		{ icon: <FaWallet size={26} />, path: '/', alias: '/cb', label: `${t("common.navItemCredentials")}`, stepClass: 'step-2-small-screen' },
		{ icon: <IoIosAddCircle size={26} />, path: '/add', label: `${t("common.navItemAddCredentialsSimple")}`, stepClass: 'step-3-small-screen' },
		{ icon: <BsQrCodeScan size={19} />, path: '/qr', label: ``, stepClass: 'step-4', isQR: true }, // QR button
		{ icon: <IoIosSend size={26} />, path: '/send', label: `${t("common.navItemSendCredentialsSimple")}`, stepClass: 'step-5-small-screen' },
	];

	const handleNavigate = (path) => {
		if (isOpen) {
			toggle();
		}

		if (location.pathname !== path) {
			navigate(path);
		}
	};

	const isActive = (item) => {
		return location.pathname === item.path || location.pathname === item.alias;
	};

	return (
		<>
			<div className={`sticky bottom-0 left-0 right-0 bg-white dark:bg-gray-800 flex justify-around px-4 pt-4 pb-6 z-40 flex md:hidden shadow-2xl rounded-t-lg`}>
				{navItems.map(item => (
					<button
						key={item.path}
						className={`${item.stepClass} ${item.isQR ? 'bg-primary dark:bg-primary-light text-white dark:text-white rounded-full p-3 shadow-lg' : `cursor-pointer flex flex-col items-center w-[20%]`} ${isActive(item) && !isOpen ? 'text-primary dark:text-white' : 'text-gray-400 dark:text-gray-400'} transition-colors duration-200`}
						onClick={() => item.isQR ? openQRScanner() : handleNavigate(item.path)}
						title={item.label}
					>
						{item.icon}
						<span className="text-xs">{item.label}</span>
					</button>
				))}
				<button
					key={t("common.navItemProfile")}
					className={`cursor-pointer flex flex-col items-center w-[20%] relative ${isOpen ? 'text-primary dark:text-white' : 'text-gray-400 dark:text-gray-400'} transition-colors duration-200`}
					onClick={toggle}
					title={t("common.navItemProfile")}
				>
					<FaUserCircle size={26} />
					<span className="text-xs">{t("common.navItemProfile")}</span>
					{updateAvailable && (
						<MdNotifications
							size={22}
							className="text-green-500 absolute top-[-10px] right-0"
						/>
					)}
				</button>
			</div>
			{/* QR Code Scanner Modal */}
			{isQRScannerOpen && (
				<QRCodeScanner
					onClose={closeQRScanner}
				/>
			)}
		</>
	);
};

export default BottomNav;
