import { useState } from 'react';

interface QRScannerState {
	isQRScannerOpen: boolean;
	openQRScanner: () => void;
	closeQRScanner: () => void;
}

export const useQRScanner = (): QRScannerState => {
	const [isQRScannerOpen, setQRScannerOpen] = useState(false);

	const openQRScanner = () => setQRScannerOpen(true);
	const closeQRScanner = () => setQRScannerOpen(false);

	return {
		isQRScannerOpen,
		openQRScanner,
		closeQRScanner
	};
};
