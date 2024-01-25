// ScanningLine.jsx
import React from 'react';

const ScanningLine = ({ qrDetected, boxSize }) => {
	const scanningLineStyle = {
		position: 'absolute',
		top: '50%',
		left: '50%',
		height: '2px',
		width: `${boxSize}px`,
		backgroundColor: 'white',
		transform: 'translateX(-50%)',
		pointerEvents: 'none',
		animation: 'scan-vertical 2s linear infinite',
		opacity: '0.5',
		display: qrDetected ? 'none' : 'block'
	};

	return <div style={scanningLineStyle} />;
};

export default ScanningLine;
