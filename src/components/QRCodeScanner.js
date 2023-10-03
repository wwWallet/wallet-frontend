import React, { useState, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import { BsQrCodeScan } from 'react-icons/bs';
import Spinner from './Spinner'; // Adjust the import path as needed

const QRCodeScanner = ({ onClose, cameraActive }) => {
  const [qrCodeData, setQRCodeData] = useState('');
  const [error, setError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);

  const handleScan = (data) => {
    if (data) {
      setQRCodeData(data);
      onClose(); // Close the scanner modal
    }
  };

  const handleClose = () => {
    setQRCodeData('');
    onClose(); // Close the scanner modal
  };

  const handleError = (err) => {
    setError(err);
  };

  useEffect(() => {
    // Check camera availability
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => {
        setCameraReady(true);
      })
      .catch((err) => {
        setError(err);
      });
  }, []);

	  // Modify the useEffect to control the camera state
		useEffect(() => {
			if (cameraActive) {
				// Check camera availability and start it
				navigator.mediaDevices.getUserMedia({ video: true })
					.then(() => {
						setCameraReady(true);
					})
					.catch((err) => {
						setError(err);
					});
			}
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [cameraActive]);

  return (
    <div className="qr-code-scanner bg-white">
      <div className={`absolute inset-0 ${!cameraReady ? 'flex justify-center items-center' : ''}`}>
        {!cameraReady && < Spinner />}
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

          {error && (
            <div className="error-message">
              Error: {error}
            </div>
          )}

          <QrReader
            delay={300}
            onError={handleError}
            onScan={handleScan}
            style={{ width: '100%', height: 'auto' }}
          />

          {qrCodeData && (
            <div className="scanned-data">
              <p>Scanned Data:</p>
              <p>{qrCodeData}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QRCodeScanner;
