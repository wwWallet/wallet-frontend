// useQRScanner.js
import { useState } from 'react';

export const useQRScanner = () => {
	const [isQRScannerOpen, setQRScannerOpen] = useState(false);
	const [cameraStream, setCameraStream] = useState(null);
	const [cameraError, setCameraError] = useState(null);

	const openQRScanner = async () => {
		setCameraError(null);
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: false,
				video: {
					facingMode: { ideal: 'environment' },
					width: { ideal: 1920 },
					height: { ideal: 1080 },
				},
			});
			setCameraStream(stream);
			setQRScannerOpen(true);
		} catch (error) {
			console.error('Camera access denied:', error);
			setCameraError(error);
			setQRScannerOpen(true);
		}
	};

	const closeQRScanner = () => {
		cameraStream?.getTracks().forEach(track => track.stop());
		setCameraStream(null);
		setCameraError(null);
		setQRScannerOpen(false);
	};

	return {
		isQRScannerOpen,
		openQRScanner,
		closeQRScanner,
		cameraStream,
		cameraError,
	};
};
