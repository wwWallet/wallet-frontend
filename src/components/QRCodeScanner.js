import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';
import { BsQrCodeScan } from 'react-icons/bs';
import { PiCameraRotateFill } from 'react-icons/pi'; // Import the camera icon
import Spinner from './Spinner'; // Adjust the import path as needed

const QRScanner = ({ onClose }) => {
  const [devices, setDevices] = useState([]);
  const webcamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false); // Initially, do not show the spinner
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);

  const handleClose = () => {
    onClose(); // Close the scanner modal
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
            // Redirect to the URL found in the QR code
            const scannedUrl = code.data;
            if (isValidUrl(scannedUrl)) {
              setLoading(true); // Show spinner
              setTimeout(() => {
                // Get the base URL (current domain)
                const baseUrl = window.location.origin;
                console.log('baseUrl', baseUrl);

                console.log(scannedUrl);
                const params = scannedUrl.split('?');
                console.log('params', params[1]);

                const cvUrl = `${baseUrl}/cb?${params[1]}`;

                window.location.href = cvUrl; // Redirect after a delay
              }, 1000); // Adjust the delay as needed (in milliseconds)
            } else {
              onClose();
            }
          }
        };
      }
    }
  };

  const isValidUrl = (url) => {
    // For a simple check, you can use a regular expression
    const urlPattern = /^(http|https):\/\/\S+$/;
    return urlPattern.test(url);
  };

  useEffect(() => {
    if (cameraReady) {
      const interval = setInterval(capture, 500); // Check every half second
      return () => clearInterval(interval);
    }
  }, [cameraReady]);

  return (
    <div className="qr-code-scanner bg-white">
      <div className={`absolute inset-0 ${!cameraReady ? 'flex justify-center items-center' : ''}`}>
        {loading && <Spinner />} {/* Display spinner when loading and camera is ready */}
      </div>
      {cameraReady && (
        <div className="bg-white p-4 rounded-lg shadow-lg w-[99%] max-h-[100vh] z-10 relative">
          <div className="flex items-start justify-between border-b rounded-t dark:border-gray-600">
            <h2 className="text-lg font-bold mb-2 text-custom-blue">
              <BsQrCodeScan size={20} className="inline mr-1 mb-1" />
              Scan the QR Code
            </h2>

            <button
              type="button"
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ml-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
              onClick={handleClose}
            >
              <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
              </svg>
            </button>
          </div>
          <hr className="mb-2 border-t border-custom-blue/80" />
          <p className="italic pd-2 text-gray-700">Target the QR Code, and you will redirect to proceed with the process</p>

          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ deviceId: devices[currentDeviceIndex].deviceId }}
            style={{ width: '100%' }}
          />

          {/* <p>{result}</p> */}
          <div className='flex justify-end'>
          {devices.length > 1 && (
            <button
              type="button"
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm px-4 py-2 mt-2"
              onClick={switchCamera}
            >
              <PiCameraRotateFill size={20}/>
            </button>
          )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
