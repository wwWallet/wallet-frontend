// Import your icons and other dependencies
import { FaWallet } from "react-icons/fa";
import { IoIosTime, IoIosAddCircle, IoIosSend } from "react-icons/io";
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const BottomNav = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const { t } = useTranslation();

	const navItems = [
		{ icon: <FaWallet size={24} />, path: '/', label: `${t("common.navItemCredentials")}` },
		{ icon: <IoIosTime size={24} />, path: '/history', label: `${t("common.navItemHistory")}` },
		{ icon: <IoIosAddCircle size={24} />, path: '/add', label: `${t("common.navItemAddCredentials")}` },
		{ icon: <IoIosSend size={24} />, path: '/send', label: `${t("common.navItemSendCredentials")}` },
	];

	const handleNavigate = (path) => {
		if (location.pathname !== path) {
			navigate(path);
		}
	};

	return (
		<div className={`fixed bottom-0 left-0 right-0 bg-white text-gray-400 flex justify-around py-4 px-2 z-50 max480:flex hidden`}>
			{navItems.map(item => (
				<div
					key={item.path}
					className={`flex flex-col items-center' ${location.pathname === item.path ? 'text-custom-blue' : 'text-gray-400 hover:text-custom-blue'}`}
					onClick={() => handleNavigate(item.path)}
				>
					{item.icon}
					{/* <span className="text-xs">{item.label}</span> */}
				</div>
			))}
		</div>
	);
};

export default BottomNav;
