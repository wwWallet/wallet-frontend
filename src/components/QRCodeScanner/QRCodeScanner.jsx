import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import QrScanner from '../../utils/qr/qr-scanner';
import PopupLayout from '../Popups/PopupLayout';
import useScreenType from '../../hooks/useScreenType';
import { H1 } from '../Shared/Heading';
import Button from '../Buttons/Button';
import { ArrowLeft, CheckCircle, QrCode, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

// Describe a camera from its label alone. Probing each device with getUserMedia to read its
// capabilities is not an option: iOS Safari only allows a getUserMedia call that is backed by a
// user gesture, so the second and any further call is rejected with NotAllowedError.
const getFacingModeFromLabel = (label) => (
	/back|rear|environment/i.test(label)
		? 'environment'
		: /front|user|face/i.test(label)
			? 'user'
			: null
);

const stopMediaTracks = (stream) => {
	stream?.getTracks().forEach(track => track.stop());
};

const QRScanner = ({ onClose, initialStream = null, cameraError = null }) => {
	const [stream, setStream] = useState(initialStream);
	const [availableFacingModes, setAvailableFacingModes] = useState([]);
	const [facingMode, setFacingMode] = useState(
		initialStream?.getVideoTracks()[0]?.getSettings().facingMode || 'environment'
	);
	const videoRef = useRef(null);
	const [cameraReady, setCameraReady] = useState(false);
	const [loading, setLoading] = useState(false);
	const [qrDetected, setQrDetected] = useState(false);
	const [zoomLevel, setZoomLevel] = useState(1);
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
		if (initialStream) {
			setCameraReady(true);
		}
	}, [initialStream]);

	useEffect(() => {
		if (!stream) {
			return;
		}
		navigator.mediaDevices.enumerateDevices()
			.then(mediaDevices => {
				const modes = mediaDevices
					.filter(({ kind }) => kind === 'videoinput')
					.map(({ label }) => getFacingModeFromLabel(label))
					.filter(Boolean);
				setAvailableFacingModes([...new Set(modes)]);
			})
			.catch(error => {
				console.error("Error enumerating devices:", error);
			});
	}, [stream]);

	const onDecode = useCallback((result) => {
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
	}, []);

	useEffect(() => {
		const videoElement = videoRef.current;
		if (!stream || !videoElement) {
			return;
		}
		videoElement.srcObject = stream;

		const qrScanner = new QrScanner(videoElement, onDecode, {
			highlightScanRegion: true,
			highlightCodeOutline: false,
		});

		qrScanner.start().catch(err => {
			console.error('Error starting QR Scanner: ', err);
		});

		return () => {
			qrScanner.stop();
			qrScanner.destroy();
			// destroy() leaves the scan region highlight behind, which would stack up on every camera switch.
			qrScanner.$overlay?.remove();
			stopMediaTracks(stream);
		};
	}, [stream, cameraReady, onDecode]);

	const switchCamera = async () => {
		if (!stream) return;
		const nextFacingMode = facingMode === 'environment' ? 'user' : 'environment';
		if (!availableFacingModes.includes(nextFacingMode)) return;
		const oldStream = stream;

		try {
			const newStream = await navigator.mediaDevices.getUserMedia({
				audio: false,
				video: {
					facingMode: { exact: nextFacingMode },
					width: { ideal: 1920 },
					height: { ideal: 1080 },
				},
			});
			setFacingMode(newStream.getVideoTracks()[0]?.getSettings().facingMode || nextFacingMode);
			setStream(newStream);
			oldStream.getTracks().forEach(track => track.stop());
		} catch (error) {
			console.error('Error switching camera: ', error);
		}
	};

	return (
		<PopupLayout isOpen={true} onClose={handleClose} loading={loading || (!cameraReady && !cameraError)} fullScreen={screenType !== 'desktop'}>
			{cameraError ? (
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
									className="mr-2"
									aria-label="Go back to the previous page"
								>
									<ArrowLeft size={20} className="text-2xl text-lm-gray-900 dark:text-dm-gray-100" />
								</button>
								<H1 heading={t('qrCodeScanner.title')} />
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
							<video
								key={stream?.id}
								ref={videoRef}
								autoPlay
								playsInline
								muted
								style={{
									transform: `scale(${zoomLevel})`,
									width: "100%",
									height: "100%",
									objectFit: "contain",
									maxHeight: '100%',
								}}
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
							{availableFacingModes.length > 1 && (
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
