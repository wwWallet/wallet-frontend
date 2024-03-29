// Import your icons and other dependencies
import { FaWallet } from "react-icons/fa";
import { IoIosTime, IoIosAddCircle, IoIosSend } from "react-icons/io";
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const BottomNav = ({ isOpen, toggle }) => {
	const location = useLocation();
	const navigate = useNavigate();
	const { t } = useTranslation();

	const navItems = [
		{ icon: <FaWallet size={26} />, path: '/', label: `${t("common.navItemCredentials")}` },
		{ icon: <IoIosTime size={26} />, path: '/history', label: `${t("common.navItemHistory")}` },
		{ icon: <IoIosAddCircle size={26} />, path: '/add', label: `${t("common.navItemAddCredentials")}` },
		{ icon: <IoIosSend size={26} />, path: '/send', label: `${t("common.navItemSendCredentials")}` },
	];

	const handleNavigate = (path) => {
		if (location.pathname !== path) {
			navigate(path);
			if (isOpen) {
				toggle();
			}
		}
	};

	return (
		<div className={`fixed bottom-0 left-0 right-0 bg-white flex justify-around p-4 z-50 max480:flex hidden shadow-2xl`}>
			{navItems.map(item => (
				<div
					key={item.path}
					className={`cursor-pointer flex flex-col items-center ${location.pathname === item.path ? 'text-custom-blue' : 'text-gray-400'} hover:text-custom-blue transition-colors duration-200`}
					onClick={() => handleNavigate(item.path)}
					title={item.label}
				>
					{item.icon}
				</div>
			))}
		</div>
	);
};

export default BottomNav;
