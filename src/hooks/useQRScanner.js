// useQRScanner.js
import { useState } from 'react';

export const useQRScanner = () => {
	const [isQRScannerOpen, setQRScannerOpen] = useState(false);

	const openQRScanner = () => setQRScannerOpen(true);
	const closeQRScanner = () => setQRScannerOpen(false);

	return {
		isQRScannerOpen,
		openQRScanner,
		closeQRScanner
	};
};
