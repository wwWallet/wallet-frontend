import React, { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
import Webcam from 'react-webcam';
import { BsQrCodeScan } from 'react-icons/bs';
import { PiCameraRotateFill } from 'react-icons/pi';
import Spinner from '../Spinner';
import { useTranslation } from 'react-i18next';
import { FaCheckCircle } from "react-icons/fa";
import { RiZoomInFill, RiZoomOutFill } from "react-icons/ri";
import QrScanner from 'qr-scanner';

const QRScanner = ({ onClose }) => {

	const [devices, setDevices] = useState([]);
	const [bestCameraResolutions, setBestCameraResolutions] = useState({ front: null, back: null });
	const webcamRef = useRef(null);
	const [cameraReady, setCameraReady] = useState(false);
	const [loading, setLoading] = useState(false);
	const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
	const [qrDetected, setQrDetected] = useState(false);
	const [zoomLevel, setZoomLevel] = useState(1);
	const [hasCameraPermission, setHasCameraPermission] = useState(null);
	const { t } = useTranslation();

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
						const isBackCamera = device.label.toLowerCase().includes('back');
						const resolution = {
							width: capabilities.width?.max || 0,
							height: capabilities.height?.max || 0
						};

						if (isBackCamera && (!bestBackCamera || bestBackCamera.resolution.width * bestBackCamera.resolution.height < resolution.width * resolution.height)) {
							bestBackCamera = { device, resolution };
						} else if (!isBackCamera && (!bestFrontCamera || bestFrontCamera.resolution.width * bestFrontCamera.resolution.height < resolution.width * resolution.height)) {
							bestFrontCamera = { device, resolution };
						}

						track.stop();
					}

					const filteredDevices = [];
					if (bestFrontCamera) {
						filteredDevices.push(bestFrontCamera.device);
					}
					if (bestBackCamera) {
						filteredDevices.push(bestBackCamera.device);
					}

					setBestCameraResolutions({
						front: bestFrontCamera ? bestFrontCamera.resolution : null,
						back: bestBackCamera ? bestBackCamera.resolution : null,
					});

					setDevices(filteredDevices);

					const backCameraIndex = filteredDevices.findIndex(device =>
						device.label.toLowerCase().includes('back'));

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
			}, { highlightScanRegion: true, highlightCodeOutline: true });

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

	const currentCameraType = devices[currentDeviceIndex]?.label.toLowerCase().includes('back') ? 'back' : 'front';
	const maxResolution = bestCameraResolutions[currentCameraType];

	let idealWidth, idealHeight;
	if (maxResolution) {
		console.log(maxResolution);

		// Determine the smaller dimension to be the basis for square dimensions
		let smallerDimension = Math.min(maxResolution.width, maxResolution.height);

		// Cap the dimension at 1920 if it exceeds this value
		if (smallerDimension > 1920) {
			idealWidth = 1920;
			idealHeight = 1920;
		} else {
			idealWidth = smallerDimension;
			idealHeight = smallerDimension;
		}
	}

	return (
		<Modal
			isOpen={true}
			onRequestClose={handleClose}
			className="absolute inset-0 flex items-center justify-center"
			overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
		>
			{hasCameraPermission === false ? (
				<div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-lg w-full lg:w-[33.33%] sm:w-[66.67%] z-10 relative m-4">
					<div className="flex items-start justify-between border-b rounded-t dark:border-gray-600">
						<h2 className="text-lg font-bold mb-2 text-primary dark:text-white">
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
					<hr className="mb-2 border-t border-primary/80 dark:border-white/80" />
					<p className='text-red-600 dark:text-red-500'>
						{t('qrCodeScanner.cameraPermissionAllow')}
					</p>
				</div>
			) : (!cameraReady || loading) ? (
				<div className="flex items-center justify-center h-24">
					<Spinner />
				</div>
			) : (
				<div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-lg w-full lg:w-[33.33%] sm:w-[66.67%] z-10 relative m-4">
					<div className="flex items-start justify-between border-b rounded-t dark:border-gray-600">
						<h2 className="text-lg font-bold mb-2 text-primary dark:text-white">
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
					<hr className="mb-2 border-t border-primary/80 dark:border-white/80" />
					<p className="italic pd-2 text-gray-700 dark:text-gray-300">
						{t('qrCodeScanner.description')}
					</p>
					<div className="webcam-container mt-4" style={{ position: 'relative', overflow: 'hidden' }}>
						<Webcam
							key={devices[currentDeviceIndex]?.deviceId}
							audio={false}
							ref={webcamRef}
							screenshotFormat="image/jpeg"
							videoConstraints={{
								deviceId: devices[currentDeviceIndex]?.deviceId,
								height: { ideal: idealHeight },
								width: { ideal: idealWidth }
							}}
							style={{ transform: `scale(${zoomLevel})` }}
							onUserMedia={onUserMedia}
						/>
						{qrDetected && (
							<div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
								<FaCheckCircle size={100} color="green" />
							</div>
						)}
					</div>
					<div className='flex justify-between align-center'>
						<div className="flex items-center my-4 pr-4 w-full">
							<RiZoomOutFill className="text-gray-400 dark:text-gray-200 mr-2 mt-2" onClick={handleZoomOut} size={35} />
							<input
								type="range"
								min="1"
								max="3"
								step="0.1"
								value={zoomLevel}
								onChange={handleZoomChange}
								className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer dark:bg-gray-700 mt-2"
							/>
							<RiZoomInFill className="text-gray-400 dark:text-gray-200 ml-2 mt-2" onClick={handleZoomIn} size={35} />
						</div>
						{devices.length > 0 && (
							<button
								type="button"
								className="text-gray-400 dark:text-gray-200 bg-transparent rounded-lg text-sm ml-4 p-2 my-4"
								onClick={switchCamera}
							>
								<PiCameraRotateFill size={25} />
							</button>
						)}
					</div>
				</div>
			)}
		</Modal>
	);
};

export default QRScanner;
