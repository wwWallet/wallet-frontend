import React from 'react';
import { BsQrCodeScan } from 'react-icons/bs';

const QRButton = ({ openQRScanner, isSmallScreen }) => {
	const isMobile = window.innerWidth <= 480;
	const buttonClass = "px-2 py-2 mb-2 text-white bg-custom-blue hover:bg-custom-blue-hover focus:ring-4 focus:outline-none focus:ring-custom-blue font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-custom-blue-hover dark:hover:bg-custom-blue-hover dark:focus:ring-custom-blue-hover shadow-md";

	if (isMobile) {
		return (
			<button
				className={`fixed z-20 bottom-20 right-5 ${buttonClass}`}
				onClick={openQRScanner}
			>
				<div className="flex items-center">
					<BsQrCodeScan size={20} className="text-white" />
				</div>
			</button>
		);
	} else if (isSmallScreen) {
		return (
			<button
				className={buttonClass}
				onClick={openQRScanner}
			>
				<div className="flex items-center">
					<BsQrCodeScan size={20} className="text-white" />
				</div>
			</button>
		);
	}

	return null;
};

export default QRButton;
