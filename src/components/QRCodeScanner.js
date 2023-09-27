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

  const handleError = (error) => {
    console.error(error);
  };

  return (
    <div className="qr-code-scanner">
      <h2>QR Code Scanner</h2>
      <QrReader
        delay={300}
        onError={handleError}
        onScan={handleScan}
        // Ensure that you pass a valid function as the onResult prop.
        onResult={handleScan} // This should be the correct prop name
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
