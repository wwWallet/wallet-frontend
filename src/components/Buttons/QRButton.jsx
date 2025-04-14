import React from 'react';
import { BsQrCodeScan } from 'react-icons/bs';
import Button from './Button';
import useScreenType from '../../hooks/useScreenType';

const QRButton = ({ openQRScanner, isSmallScreen }) => {
	const screenType = useScreenType();

	if (screenType === 'tablet') {
		return (
			<div className="mb-2">
				<Button
					id="open-qr-scanner"
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
