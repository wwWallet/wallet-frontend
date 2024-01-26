import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';
import { BsQrCodeScan } from 'react-icons/bs';
import { PiCameraRotateFill } from 'react-icons/pi';
import Spinner from '../Spinner';
import { useTranslation } from 'react-i18next';
import { FaCheckCircle } from "react-icons/fa";
import CornerBox from './CornerBox';
import ScanningLine from './ScanningLine';

const QRScanner = ({ onClose }) => {

	const [devices, setDevices] = useState([]);
	const webcamRef = useRef(null);
	const [cameraReady, setCameraReady] = useState(false);
	const [loading, setLoading] = useState(false);
	const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
	const [qrDetected, setQrDetected] = useState(false);
	const [boxSize, setBoxSize] = useState(null);
	const { t } = useTranslation();

	const handleClose = () => {
		onClose();
	};

	useEffect(() => {
		navigator.mediaDevices.enumerateDevices()
			.then(mediaDevices => {
				const videoDevices = mediaDevices.filter(({ kind }) => kind === "videoinput");
				setDevices(videoDevices);

				// Find and prioritize the back camera if it exists
				const backCameraIndex = videoDevices.findIndex(device => device.label.toLowerCase().includes('back'));
				if (backCameraIndex !== -1) {
					setCurrentDeviceIndex(backCameraIndex);
				}

				setCameraReady(true);
			})
			.catch(error => {
				console.error("Error accessing camera:", error);
				setCameraReady(false);
			});
	}, []);

	const switchCamera = () => {
		if (devices.length > 1) {
			const newIndex = (currentDeviceIndex + 1) % devices.length;
			setCurrentDeviceIndex(newIndex);
		}
	};

	const capture = () => {
		if (webcamRef.current) {
			const imageSrc = webcamRef.current.getScreenshot();
			if (imageSrc) {
				const image = new Image();
				image.src = imageSrc;
				image.onload = () => {
					const canvas = document.createElement('canvas');
					const context = canvas.getContext('2d');
					canvas.width = image.width;
					canvas.height = image.height;
					context.drawImage(image, 0, 0, image.width, image.height);
					const imageData = context.getImageData(0, 0, image.width, image.height);
					const code = jsQR(imageData.data, imageData.width, imageData.height);
					if (code) {
						setQrDetected(true);
						// Redirect to the URL found in the QR code
						const scannedUrl = code.data;
						setLoading(true);
						setTimeout(() => {
							const baseUrl = window.location.origin;
							const params = scannedUrl.split('?');
							const cvUrl = `${baseUrl}/cb?${params[1]}&wwwallet_camera_was_used=true`;
							window.location.href = cvUrl;
						}, 1500);

					}
				};
			}
		}
	};

	const calculateBoxSize = () => {
		if (webcamRef.current && webcamRef.current.video.videoWidth) {
			const webcamElement = webcamRef.current.video;
			const width = webcamElement.offsetWidth;
			const height = webcamElement.offsetHeight;
			const size = Math.min(width, height) * 0.9;
			let scanningMargin = 20;
			if ( height > width ) {
				scanningMargin = (height-size)/2;
			}			
			document.documentElement.style.setProperty('--scanning-margin', scanningMargin+'px');

			setBoxSize(size);
		}
	};

	useEffect(() => {
		if (cameraReady) {
			const interval = setInterval(capture, 500);
			return () => clearInterval(interval);
		}
	}, [cameraReady]);

	useEffect(() => {
		calculateBoxSize();
		console.log('calculate box');
		window.addEventListener('resize', calculateBoxSize);
		return () => window.removeEventListener('resize', calculateBoxSize);
	}, []);

	const waitForVideoDimensions = () => {
		const checkDimensions = () => {
			if (webcamRef.current && webcamRef.current.video.videoWidth) {
				calculateBoxSize();
			} else {
				setTimeout(checkDimensions, 100);
			}
		};
		checkDimensions();
	};

	const onUserMedia = () => {
		waitForVideoDimensions();
	};

	return (
		<div className="qr-code-scanner bg-white">
			<div className={`absolute inset-0 ${!cameraReady ? 'flex justify-center items-center' : ''}`}>
				{loading && <Spinner />}
			</div>
			{cameraReady && (
				<div className="bg-white p-4 rounded-lg shadow-lg w-[99%] max-h-[100vh] z-10 relative">
					<div className="flex items-start justify-between border-b rounded-t dark:border-gray-600">
						<h2 className="text-lg font-bold mb-2 text-custom-blue">
							<BsQrCodeScan size={20} className="inline mr-1 mb-1" />
							{t('qrCodeScanner.title')}
						</h2>

						<button
							type="button"
							className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
							onClick={handleClose}
						>
							<svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
								<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
							</svg>
						</button>
					</div>
					<hr className="mb-2 border-t border-custom-blue/80" />
					<p className="italic pd-2 text-gray-700">
						{t('qrCodeScanner.description')}
					</p>
					<div className="webcam-container" style={{ position: 'relative' }}>
						<Webcam
							audio={false}
							ref={webcamRef}
							screenshotFormat="image/jpeg"
							videoConstraints={{ deviceId: devices[currentDeviceIndex].deviceId }}
							style={{ width: '100%' }}
							onUserMedia={onUserMedia}
						/>
						{boxSize && (
							<>
								<CornerBox qrDetected={qrDetected} side="borderLeft" position="borderTop" boxSize={boxSize} />
								<CornerBox qrDetected={qrDetected} side="borderRight" position="borderTop" boxSize={boxSize} />
								<CornerBox qrDetected={qrDetected} side="borderLeft" position="borderBottom" boxSize={boxSize} />
								<CornerBox qrDetected={qrDetected} side="borderRight" position="borderBottom" boxSize={boxSize} />
								<ScanningLine qrDetected={qrDetected} boxSize={boxSize} />
							</>
						)}
						{qrDetected && (
							<div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
								<FaCheckCircle size={100} color="green" />
							</div>
						)}
					</div>
					<div className='flex justify-end'>
						{devices.length > 1 && (
							<button
								type="button"
								className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm px-4 py-2 mt-2"
								onClick={switchCamera}
							>
								<PiCameraRotateFill size={20} />
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default QRScanner;
