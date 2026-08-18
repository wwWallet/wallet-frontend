import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import QrScanner from '../../utils/qr/qr-scanner';
import { qrLog } from '../../utils/qr/qr-log';
import PopupLayout from '../Popups/PopupLayout';
import useScreenType from '../../hooks/useScreenType';
import { H1 } from '../Shared/Heading';
import Button from '../Buttons/Button';
import { ArrowLeft, CheckCircle, QrCode, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

// Describe a camera from its label alone. Probing each device with getUserMedia to read its
// capabilities is not an option: iOS Safari only allows a getUserMedia call that is backed by a
// user gesture, so the second and any further call is rejected with NotAllowedError.
const describeCamera = ({ deviceId, label }) => ({
	deviceId,
	label,
	facingMode: /back|rear|environment/i.test(label)
		? 'environment'
		: /front|user|face/i.test(label)
			? 'user'
			: 'unknown',
});

const stopMediaTracks = (stream) => {
	stream?.getTracks().forEach(track => {
		track.stop();
	});
};

const QRScanner = ({ onClose, initialStream = null, cameraError = null }) => {
	const [devices, setDevices] = useState([]);
	const [stream, setStream] = useState(initialStream);
	const streamRef = useRef(null);
	const videoRef = useRef(null);
	const [cameraReady, setCameraReady] = useState(false);
	const [loading, setLoading] = useState(false);
	const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);
	const [qrDetected, setQrDetected] = useState(false);
	const [zoomLevel, setZoomLevel] = useState(1);
	const [hasCameraPermission] = useState(Boolean(initialStream) && !cameraError);
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

	// Camera access is requested by useQRScanner from the opening button's user gesture.
	useEffect(() => {
		if (initialStream) {
			const track = initialStream.getVideoTracks()[0];
			qrLog('component', 'camera stream received', {
				trackLabel: track?.label,
				settings: track?.getSettings(),
			});
			streamRef.current = initialStream;
			setCameraReady(true);
		}
	}, [initialStream]);

	// Labels are only populated once permission has been granted, which is why this runs off the stream
	// rather than on mount. Purely informational: it feeds the camera switch button.
	useEffect(() => {
		if (!stream) return;
		navigator.mediaDevices.enumerateDevices()
			.then(mediaDevices => {
				const videoDevices = mediaDevices.filter(({ kind }) => kind === "videoinput");
				qrLog('component', `enumerated ${videoDevices.length} video input device(s)`,
					videoDevices.map(({ deviceId, label, groupId }) => ({ deviceId, label, groupId })));

				const cameras = videoDevices.map(describeCamera);
				const activeDeviceId = stream.getVideoTracks()[0]?.getSettings()?.deviceId;
				const activeIndex = cameras.findIndex(({ deviceId }) => deviceId === activeDeviceId);

				setDevices(cameras);
				setCurrentDeviceIndex(activeIndex === -1 ? 0 : activeIndex);
				qrLog('component', 'camera list ready', {
					cameras,
					activeDeviceId,
					activeCamera: cameras[activeIndex]?.label ?? 'not matched in the device list',
				});
			})
			.catch(error => {
				console.error("Error enumerating devices:", error);
				qrLog('component', 'device enumeration failed', error);
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

	// Hand the stream we already hold to the video element and scan it. QrScanner reuses an existing
	// srcObject instead of opening the camera itself, so this adds no getUserMedia call of its own.
	useEffect(() => {
		const videoElement = videoRef.current;
		if (!stream || !videoElement) return;

		videoElement.srcObject = stream;
		const activeTrack = stream.getVideoTracks()[0];
		qrLog('component', 'attaching QR scanner to the video element', {
			screenType,
			trackLabel: activeTrack?.label,
			trackSettings: activeTrack?.getSettings(),
		});

		const qrScanner = new QrScanner(videoElement, onDecode, {
			highlightScanRegion: true,
			highlightCodeOutline: false,
		});

		qrScanner.start().catch(err => {
			console.error('Error starting QR Scanner: ', err);
			qrLog('component', `starting the QR scanner failed with ${err?.name}`, err);
		});

		return () => {
			qrScanner.stop();
			qrScanner.destroy();
			// destroy() leaves the scan region highlight behind, which would stack up on every camera switch.
			qrScanner.$overlay?.remove();
			stopMediaTracks(stream);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- screenType is only logged, it must not re-attach the scanner
	}, [stream, cameraReady, onDecode]);

	// Runs from a tap, so this getUserMedia call has the user gesture iOS requires.
	const switchCamera = async () => {
		if (devices.length < 2) return;
		const newIndex = (currentDeviceIndex + 1) % devices.length;
		qrLog('component', 'switching camera', {
			from: devices[currentDeviceIndex]?.label,
			to: devices[newIndex]?.label,
			facingMode: devices[newIndex]?.facingMode,
		});

		// Stop the current capture first: iOS Safari allows only one camera stream at a time.
		stopMediaTracks(stream);
		streamRef.current = null;
		setStream(null);
		setCameraReady(false);

		try {
			const newStream = await navigator.mediaDevices.getUserMedia({
				video: {
					deviceId: { exact: devices[newIndex].deviceId },
					width: { ideal: 1920 },
					height: { ideal: 1080 },
				},
			});
			setCurrentDeviceIndex(newIndex);
			streamRef.current = newStream;
			setStream(newStream);
		} catch (error) {
			console.error('Error switching camera: ', error);
			qrLog('component', `switching camera failed with ${error?.name}`, error);
			setCameraReady(false);
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
								// A fresh element per stream: destroying a scanner clears the srcObject of its video
								// on a delay, which would otherwise tear down the stream that replaced it.
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
