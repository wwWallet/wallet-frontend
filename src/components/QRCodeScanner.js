import React, { useState, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import { BsQrCodeScan } from 'react-icons/bs';
import Spinner from './Spinner'; // Adjust the import path as needed

const QRCodeScanner = ({ onClose }) => {
  const [error, setError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleScan = (data) => {
		if (data && data.text) {
			const scannedUrl = data.text;
      // Check if the scanned data is a valid URL
      if (isValidUrl(scannedUrl)) {
        setLoading(true); // Show spinner
        setTimeout(() => {
					// Get the base URL (current domain)
					const baseUrl = window.location.origin;
					console.log('baseUrl',baseUrl);

					console.log(scannedUrl);
					const params = scannedUrl.split('?'); 
					console.log('params',params[1]);

					const cvUrl = `${baseUrl}/cb?${params[1]}`;
					
          window.location.href = cvUrl; // Redirect after a delay
        }, 1000); // Adjust the delay as needed (in milliseconds)
      } else {
        onClose();
      }
    }
  };

  const isValidUrl = (url) => {
    // For a simple check, you can use a regular expression
    const urlPattern = /^(http|https):\/\/\S+$/;
    return urlPattern.test(url);
  };

  const handleClose = () => {
    onClose(); // Close the scanner modal
  };

  const handleError = (err) => {
    setError(err);
  };

  useEffect(() => {
    // Check camera availability
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(() => {
        setCameraReady(true);
      })
      .catch((err) => {
        setError(err);
      });
  }, []);


  return (
    <div className="qr-code-scanner bg-white">
      <div className={`absolute inset-0 ${!cameraReady ? 'flex justify-center items-center' : ''}`}>
        {!cameraReady && <Spinner />}
        {loading && <Spinner />} {/* Display spinner while loading */}
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
            onResult={handleScan}
            style={{ width: '100%' }}
          />
          
        </div>
      )}
    </div>
  );
};

export default QRCodeScanner;
