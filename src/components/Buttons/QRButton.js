import React from 'react';
import { BsQrCodeScan } from 'react-icons/bs';
import Button from './Button';

const QRButton = ({ openQRScanner, isSmallScreen }) => {
	const isMobile = window.innerWidth <= 480;

	if (isSmallScreen && !isMobile) {
		return (
			<div className="mb-2">
				<Button
					onClick={openQRScanner}
					variant="primary"
					additionalClassName={`step-2`}
				>
					<BsQrCodeScan size={20} className="text-white" />
				</Button>
			</div>

		);
	}

	return null;
};

export default QRButton;
