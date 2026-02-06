import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { useTranslation } from 'react-i18next';
import QrScanner from '../../utils/qr/qr-scanner';
import PopupLayout from '../Popups/PopupLayout';
import useScreenType from '../../hooks/useScreenType';
import { H1 } from '../Shared/Heading';
import Button from '../Buttons/Button';
import { ArrowLeft, CheckCircle, QrCode, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

const QRScanner = ({ onClose }) => {
	const [devices, setDevices] = useState([]);
	const webcamRef = useRef(null);
	const [cameraReady, setCameraReady] = useState(false);
	const [loading, setLoading] = useState(false);
	const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
	const [qrDetected, setQrDetected] = useState(false);
	const [zoomLevel, setZoomLevel] = useState(1);
	const [hasCameraPermission, setHasCameraPermission] = useState(null);
	const { t } = useTranslation();
	const screenType = useScreenType();

	const handleZoomChange = (event) => {
		const newZoomLevel = Number(event.target.value);
		setZoomLevel(newZoomLevel);
	};

	const handleZoomIn = () => {
		setZoomLevel(prevZoomLevel => Math.min(prevZoomLevel + 0.2, 3));
	};

	const handleZoomOut = () => {
		setZoomLevel(prevZoomLevel => Math.max(prevZoomLevel - 0.2, 1));
	};

	const handleClose = () => {
		onClose();
	};

	useEffect(() => {
		navigator.mediaDevices.getUserMedia({ video: true })
			.then(stream => {
				setHasCameraPermission(true);
				stream.getTracks().forEach(track => track.stop());
			})
			.catch(error => {
				console.error("Camera access denied:", error);
				setHasCameraPermission(false);
			});
	}, []);

	useEffect(() => {
		if (hasCameraPermission) {
			navigator.mediaDevices.enumerateDevices()
				.then(async mediaDevices => {
					const videoDevices = mediaDevices.filter(({ kind }) => kind === "videoinput");

					let bestFrontCamera = null;
					let bestBackCamera = null;

					for (const device of videoDevices) {
						const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: device.deviceId } });
						const track = stream.getVideoTracks()[0];
						const capabilities = track.getCapabilities();
						// const isBackCamera = device.label.toLowerCase().includes('back');
						const isBackCamera = capabilities.facingMode.includes('environment');

						const resolution = {
							width: capabilities.width?.max || 0,
							height: capabilities.height?.max || 0,
							idealHeight: Math.min(capabilities.height?.max, capabilities.width.max, 1080)
						};

						if (isBackCamera && (!bestBackCamera || bestBackCamera.resolution.width * bestBackCamera.resolution.height < resolution.width * resolution.height)) {
							bestBackCamera = { device, resolution: resolution, facingMode: 'environment' };
						} else if (!isBackCamera && (!bestFrontCamera || bestFrontCamera.resolution.width * bestFrontCamera.resolution.height < resolution.width * resolution.height)) {
							bestFrontCamera = { device, resolution: resolution, facingMode: 'user' };
						}

						track.stop();
					}

					const filteredDevices = [];
					if (bestFrontCamera) {
						filteredDevices.push(bestFrontCamera);
					}
					if (bestBackCamera) {
						filteredDevices.push(bestBackCamera);
					}

					setDevices(filteredDevices);

					const backCameraIndex = filteredDevices.findIndex(devices =>
						devices.device.deviceId === bestBackCamera?.device?.deviceId);

					if (backCameraIndex !== -1) {
						setCurrentDeviceIndex(backCameraIndex);
					} else {
						setCurrentDeviceIndex(0);
					}
					setCameraReady(true);
				})
				.catch(error => {
					console.error("Error enumerating devices:", error);
				});
		}
	}, [hasCameraPermission]);

	const stopMediaTracks = (stream) => {
		stream.getTracks().forEach(track => {
			track.stop();
		});
	};

	const switchCamera = () => {
		if (devices.length > 1) {
			const newIndex = (currentDeviceIndex + 1) % devices.length;
			if (webcamRef.current && webcamRef.current.stream) {
				stopMediaTracks(webcamRef.current.stream);
			}
			setCurrentDeviceIndex(newIndex);
		}
	};

	const onUserMedia = () => {

		if (webcamRef.current && webcamRef.current.video) {

			const videoElement = webcamRef.current.video;
			const qrScanner = new QrScanner(videoElement, (result) => {
				console.log('decoded qr code:', result);
				setQrDetected(true);
				// Redirect to the URL found in the QR code
				const scannedUrl = result.data;
				setTimeout(() => {
					setLoading(true);
				}, 3000);
				setTimeout(() => {
					const baseUrl = window.location.origin;
					const params = scannedUrl.split('?');
					const cvUrl = `${baseUrl}/cb?${params[1]}&wwwallet_camera_was_used=true`;
					window.location.href = cvUrl;
				}, 1000);
			}, { highlightScanRegion: true, highlightCodeOutline: false });

			qrScanner.start().catch(err => {
				console.error('Error starting QR Scanner: ', err);
				// Optionally update UI or state to reflect the error
			});

			return () => {
				qrScanner.stop();
				qrScanner.destroy();
			};
		}
	};

	return (
		<PopupLayout isOpen={true} onClose={handleClose} loading={loading || !cameraReady} fullScreen={screenType !== 'desktop'}>
			{hasCameraPermission === false ? (
				<>
					<div className="flex items-start justify-between border-b rounded-t dark:border-dm-gray-600">
						<h2 className="text-lg font-bold mb-2 text-lm-gray-900 dark:text-dm-gray-100">
							<QrCode size={20} className="inline mr-1 mb-1" />
							{t('qrCodeScanner.title')}
						</h2>

						<Button
							id="close-qr-code-scanner-perm"
							variant="outline"
							square={true}
							onClick={handleClose}
						>
							<svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
								<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
							</svg>
						</Button>
					</div>
					<hr className="mb-2 border-t border-lm-gray-400 dark:border-dm-gray-600" />
					<p className='text-lm-red dark:text-dm-red'>
						{t('qrCodeScanner.cameraPermissionAllow')}
					</p>
				</>
			) : cameraReady && !loading && (
				<>
					<div>
						{screenType === 'mobile' ? (
							<div className='flex'>
								<button
									id="close-qr-code-scanner-mobile"
									onClick={handleClose}
									className="mr-2 mb-2"
									aria-label="Go back to the previous page"
								>
									<ArrowLeft size={20} className="text-2xl text-lm-gray-900 dark:text-dm-gray-100" />
								</button>
								<H1 heading={t('qrCodeScanner.title')} hr={false} />
							</div>
						) : (
							<div className="flex items-start justify-between border-b rounded-t border-lm-gray-400 dark:border-dm-gray-600">

								<h2 className="text-lg font-bold mb-2 text-lm-gray-900 dark:text-dm-gray-100">
									<QrCode size={20} className="inline mr-1 mb-1" />
									{t('qrCodeScanner.title')}
								</h2>
								<Button
									id="close-qr-code-scanner"
									onClick={handleClose}
								>
									<svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
										<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
									</svg>
								</Button>
								<hr className="mb-2 border-t border-lm-gray-400 dark:border-dm-gray-600" />
							</div>
						)}


						{screenType !== 'mobile' && (
							<p className="italic pd-2 text-lm-gray-800 dark:text-dm-gray-200">
								{t('qrCodeScanner.description')}
							</p>
						)}
					</div>
					<div className="webcam-container mt-4 relative flex items-center justify-center">
						<div className="relative w-full max-h-[60vh] flex justify-center items-center overflow-hidden">
							<Webcam
								key={devices[currentDeviceIndex]?.device.deviceId}
								audio={false}
								ref={webcamRef}
								screenshotFormat="image/jpeg"
								videoConstraints={{
									deviceId: devices[currentDeviceIndex]?.device.deviceId,
									height: { ideal: devices[currentDeviceIndex]?.resolution.idealHeight, max: devices[currentDeviceIndex]?.resolution.height }
								}}
								style={{
									transform: `scale(${zoomLevel})`,
									width: "100%",
									height: "100%",
									objectFit: "contain",
									maxHeight: '100%',
								}}
								onUserMedia={onUserMedia}
							/>
							{qrDetected && (
								<div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
									<CheckCircle size={100} color="green" />
								</div>
							)}
						</div>
					</div>
					<div className='flex justify-between align-center'>
						<div className="flex items-center my-4 w-full">

							<button
								id="zoom-out-qr-code-scanner"
								type="button"
								className="text-lm-gray-800 dark:text-dm-gray-200 mr-2 mt-2 cursor-pointer"
								onClick={handleZoomOut}
							>
								<ZoomOut size={30} />
							</button>
							<input
								type="range"
								min="1"
								max="3"
								step="0.1"
								value={zoomLevel}
								onChange={handleZoomChange}
								className="w-full h-2 bg-lm-gray-200 rounded-lg cursor-pointer dark:bg-dm-gray-700 mt-2"
							/>
							<button
								id="zoom-in-qr-code-scanner"
								type="button"
								className="text-lm-gray-800 dark:text-dm-gray-200 ml-2 mt-2 cursor-pointer"
								onClick={handleZoomIn}
							>
								<ZoomIn size={30} />
							</button>
							{devices.length > 1 && (
								<button
									id="switch-camera-qr-code-scanner"
									type="button"
									className="text-lm-gray-800 dark:text-dm-gray-200 text-sm ml-4 mt-2"
									onClick={switchCamera}
								>
									<RotateCw size={30} />
								</button>
							)}
						</div>
					</div>
				</>
			)}
		</PopupLayout>
	);
};

export default QRScanner;
