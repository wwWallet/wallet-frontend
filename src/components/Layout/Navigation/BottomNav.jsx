import React, { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StatusContext from '@/context/StatusContext';
import { useQRScanner } from '../../../hooks/useQRScanner';
import QRCodeScanner from '../../QRCodeScanner/QRCodeScanner';
import CredentialsContext from '@/context/CredentialsContext';
import CounterBadge from '@/components/Shared/CounterBadge';
import { Bell, PlusCircle, QrCode, Send, UserCircle, Wallet } from 'lucide-react';

const BottomNav = ({ isOpen, toggle }) => {
	const { updateAvailable } = useContext(StatusContext);
	const { pendingTransactions } = useContext(CredentialsContext);
	const { isQRScannerOpen, openQRScanner, closeQRScanner } = useQRScanner();
	const location = useLocation();
	const navigate = useNavigate();
	const { t } = useTranslation();

	const navItems = [
		{ icon: <Wallet size={20} />, id: 'credentials', path: '/', alias: '/cb', label: `${t("common.navItemCredentials")}`, stepClass: 'step-2-small-screen', counter: pendingTransactions?.length ?? undefined, },
		{ icon: <PlusCircle size={20} />, id: 'add', path: '/add', label: `${t("common.navItemAddCredentialsSimple")}`, stepClass: 'step-3-small-screen' },
		{ icon: <QrCode size={20} />, id: 'qr', path: '/qr', label: ``, stepClass: 'step-4', isQR: true }, // QR button
		{ icon: <Send size={20} />, id: 'send', path: '/send', label: `${t("common.navItemSendCredentialsSimple")}`, stepClass: 'step-5-small-screen' },
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
			<div className={`sticky flex items-center bottom-0 left-0 right-0 bg-inherit border-t border-lm-gray-400 dark:border-dm-gray-600 justify-around px-4 pt-4 pb-6 z-40 md:hidden`}>
				{navItems.map(item => (
					<button
						id={`bottom-nav-item-${item.id}`}
						key={item.path}
						className={`relative ${item.stepClass} ${item.isQR ? 'bg-black dark:bg-white text-white dark:text-lm-gray-900 rounded-full p-3 shadow-lg' : `cursor-pointer flex flex-col items-center gap-1 w-[20%] ${isActive(item) && !isOpen ? 'text-lm-gray-900 dark:text-white' : 'text-lm-gray-700 dark:text-dm-gray-300'}`} transition-colors duration-200`}
						onClick={() => item.isQR ? openQRScanner() : handleNavigate(item.path)}
						title={item.label}
					>
						<div className="relative">
							{item.icon}
							{/* top-right floating badge */}
							<CounterBadge
								count={item.counter}
								position="top-right"
								ariaLabel="pending"
								// small nudge so it looks good with your icons
								className="translate-x-2 -translate-y-1"
								active={isActive(item)}
							/>
						</div>
						<span className={`hidden 2xs:block text-xs ${isActive(item) && !isOpen ? 'font-medium' : ''}`}>
							{item.label}
						</span>
						{isActive(item) && !isOpen && (
							<div role="presentation" className="absolute bottom-[-12px] left-[50%]  translate-x-[-50%] w-2 h-2 rounded-full bg-brand-lighter dark:bg-brand-light"></div>
						)}
					</button>
				))}
				<button
					id="bottom-nav-item-profile"
					key={t("common.navItemProfile")}
					className={`relative cursor-pointer flex flex-col items-center gap-1 w-[20%] relative ${isOpen ? 'text-lm-gray-900 dark:text-white' : 'text-lm-gray-700 dark:text-dm-gray-300'} transition-colors duration-200`}
					onClick={toggle}
					title={t("common.navItemProfile")}
				>
					<UserCircle size={20} />
					<span className="hidden 2xs:block text-xs">
						{t("common.navItemProfile")}
					</span>
					{updateAvailable && (
						<Bell
							size={16}
							fill='currentColor'
							className="text-lm-green dark:text-dm-green absolute top-[-5px] right-[5px]"
						/>
					)}
					{isOpen && (
							<div role="presentation" className="absolute bottom-[-12px] left-[50%]  translate-x-[-50%] w-2 h-2 rounded-full bg-brand-lighter dark:bg-brand-light"></div>
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
