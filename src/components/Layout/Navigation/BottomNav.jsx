import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/pro-solid-svg-icons';
import { faCirclePlus, faQrcode, faSend, faUserCircle, faWallet } from '@fortawesome/pro-regular-svg-icons';

import StatusContext from '@/context/StatusContext';

import { useQRScanner } from '@/hooks/useQRScanner';

import QRCodeScanner from '@/components/QRCodeScanner/QRCodeScanner';

const BottomNav = ({ isOpen, toggle }) => {
	//General
	const navigate = useNavigate();
	const location = useLocation();
	const { t } = useTranslation();
	const { updateAvailable } = useContext(StatusContext);
	const { isQRScannerOpen, openQRScanner, closeQRScanner } = useQRScanner();

	//Data
	const navItems = [
		{ icon: faWallet, id: 'credentials', path: '/', alias: '/cb', label: `${t("common.navItemCredentials")}`, stepClass: 'step-2-small-screen' },
		{ icon: faCirclePlus, id: 'add', path: '/add', label: `${t("common.navItemAddCredentialsSimple")}`, stepClass: 'step-3-small-screen' },
		{ icon: faQrcode, id: 'qr', path: '/qr', label: ``, stepClass: 'step-4', isQR: true }, // QR button
		{ icon: faSend, id: 'send', path: '/send', label: `${t("common.navItemSendCredentialsSimple")}`, stepClass: 'step-5-small-screen' },
	];

	//Handlers
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

	//Render
	return (
		<>
			<div className={`sticky flex items-center bottom-0 left-0 right-0 bg-c-lm-gray-100 dark:bg-c-dm-gray-800 border-t border-c-lm-gray-400 dark:border-c-dm-gray-600 flex justify-around px-4 py-3 z-40 flex md:hidden`}>
				{navItems.map(item => (
					<button
						id={`bottom-nav-item-${item.id}`}
						key={item.path}
						className={`${item.stepClass} ${item.isQR ? 'bg-c-lm-gray-900 dark:bg-c-dm-gray-100 rounded-full items-center justify-center shadow-lg h-14 w-14 flex items-center justify-center' : `cursor-pointer flex flex-col items-center w-[20%]`} ${item.isQR ? 'text-c-lm-gray-100 dark:text-c-dm-gray-900' : isActive(item) && !isOpen ? 'text-c-lm-gray-900 dark:text-c-dm-gray-100' : 'text-c-lm-gray-700 dark:text-c-dm-gray-300'} transition-colors duration-150`}
						onClick={() => item.isQR ? openQRScanner() : handleNavigate(item.path)}
						title={item.label}
					>
						<FontAwesomeIcon icon={item.icon} className="text-2xl" fixedWidth />

						{item.label && item.label !== '' &&
							<span className="hidden 2xs:block text-xs mt-1">
								{item.label}
							</span>
						}
					</button>
				))}

				<button
					id="bottom-nav-item-profile"
					key={t("common.navItemProfile")}
					className={`cursor-pointer flex flex-col items-center w-[20%] relative ${isOpen ? 'text-primary dark:text-white' : 'text-gray-400 dark:text-gray-400'} transition-colors duration-200`}
					onClick={toggle}
					title={t("common.navItemProfile")}
				>
					<FontAwesomeIcon icon={faUserCircle} className='text-2xl' fixedWidth />

					<span className="hidden 2xs:block text-xs mt-1">
						{t("common.navItemProfile")}
					</span>

					{updateAvailable && (
						<FontAwesomeIcon
							icon={faBell}
							className="text-c-lm-red dark:text-c-dm-red absolute top-[-6px] right-2"
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
