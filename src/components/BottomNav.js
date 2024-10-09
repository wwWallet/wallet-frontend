import React, { useContext, useState } from 'react';
import { FaWallet, FaUserCircle } from "react-icons/fa";
import { IoIosAddCircle, IoIosSend } from "react-icons/io";
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MdNotifications } from "react-icons/md";
import StatusContext from '../context/StatusContext';
import { BsQrCodeScan } from 'react-icons/bs';
import QRCodeScanner from './QRCodeScanner/QRCodeScanner';

const BottomNav = ({ isOpen, toggle }) => {
	const [isQRScannerOpen, setQRScannerOpen] = useState(false);
	const { updateAvailable } = useContext(StatusContext);
	const location = useLocation();
	const navigate = useNavigate();
	const { t } = useTranslation();

	const navItems = [
		{ icon: <FaWallet size={26} />, path: '/', alias: '/cb', label: `${t("common.navItemCredentials")}`, stepClass: 'step-3-mobile' },
		{ icon: <IoIosAddCircle size={26} />, path: '/add', label: `${t("common.navItemAddCredentialsSimple")}`, stepClass: 'step-4-mobile' },
		{ icon: <BsQrCodeScan size={19} />, path: '/qr', label: ``, stepClass: 'step-qr-mobile', isQR: true }, // QR button
		{ icon: <IoIosSend size={26} />, path: '/send', label: `${t("common.navItemSendCredentialsSimple")}`, stepClass: 'step-5-mobile' },
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
			<div className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 flex justify-around p-4 z-40 max480:flex hidden shadow-2xl rounded-t-lg`}>
				{navItems.map(item => (
					<button
						key={item.path}
						className={`${item.isQR ? 'bg-primary dark:bg-primary-light text-white dark:text-white rounded-full p-3 shadow-lg step-2' : `${item.stepClass} cursor-pointer flex flex-col items-center w-[20%]`} ${isActive(item) && !isOpen ? 'text-primary dark:text-white' : 'text-gray-400 dark:text-gray-400'} transition-colors duration-200`}
						onClick={() => item.isQR ? setQRScannerOpen(true) : handleNavigate(item.path)}
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
					onClose={()=>setQRScannerOpen(false)}
				/>
			)}
		</>
	);
};

export default BottomNav;
