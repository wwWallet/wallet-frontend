import React from 'react';
import { BsQrCodeScan } from 'react-icons/bs';
import GetButton from './GetButton';

const QRButton = ({ openQRScanner, isSmallScreen }) => {
	const isMobile = window.innerWidth <= 480;

	if (isSmallScreen) {
		return (
			<div className="mb-2">
				<GetButton
					content={
						<BsQrCodeScan size={20} className="text-white" />
					}
					onClick={openQRScanner}
					variant="primary"
					additionalClassName={`${isMobile ? "fixed z-20 bottom-[85px] right-5" : ""}`}
				/>
			</div>

		);
	}

	return null;
};

export default QRButton;
