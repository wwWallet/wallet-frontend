import React from 'react';
import Button from './Button';
import useScreenType from '../../hooks/useScreenType';
import { QrCode } from 'lucide-react';

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
					<QrCode size={20} className="text-inherit" />
				</Button>
			</div>

		);
	}

	return null;
};

export default QRButton;
