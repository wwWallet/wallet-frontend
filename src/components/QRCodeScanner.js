import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';

const QRCodeScanner = ({ onClose }) => {
  const [qrCodeData, setQRCodeData] = useState('');

  const handleScan = (data) => {
    if (data) {
      setQRCodeData(data);
			console.log('data:',data);

      onClose();
    }
  };


  const handleClose = () => {
    setQRCodeData(''); // Clear the scanned data
    onClose(); // Close the scanner modal
  };

  const handleError = (error) => {
    console.error(error);
  };

  return (
		<div className="qr-code-scanner">
      <h2>QR Code Scanner</h2>
      <button onClick={handleClose}>Close</button> {/* Close button */}
      <QrReader
        delay={300}
        onError={handleError}
        onScan={handleScan}
        style={{ width: '100%' }}
      />
      {qrCodeData && (
        <div>
          <p>Scanned Data:</p>
          <p>{qrCodeData}</p>
        </div>
      )}
    </div>
  );
};

export default QRCodeScanner;
