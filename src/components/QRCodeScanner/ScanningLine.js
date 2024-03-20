// ScanningLine.jsx
import React from 'react';

const ScanningLine = ({ qrDetected, boxSize }) => {
	const scanningLineStyle = {
		position: 'absolute',
		top: '50%',
		left: '5%',
		height: '2px',
		width: `${boxSize}px`,
		backgroundColor: 'green',
		transform: 'translateX(-50%) translateY(-50%)',
		pointerEvents: 'none',
		animation: 'scan-vertical 5s linear infinite',
		opacity: 0.5,
		display: qrDetected ? 'none' : 'block',
		willChange: 'transform',
		backfaceVisibility: 'hidden'
	};

	return <div style={scanningLineStyle} />;
};

export default ScanningLine;
