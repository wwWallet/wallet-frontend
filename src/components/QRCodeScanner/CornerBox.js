// CornerBox.jsx
import React from 'react';

const CornerBox = ({ qrDetected, side, position, boxSize }) => {
	const cornerStyle = (side, position) => ({
		position: 'absolute',
		[side]: `4px solid ${qrDetected ? 'green' : 'white'}`,
		[position]: `4px solid ${qrDetected ? 'green' : 'white'}`,
		borderRadius: '2px',
		top: '50%', left: '50%',
		width: '20px', height: '20px',
		transform: `translate(${getTransform(side, position)})`,
		pointerEvents: 'none',
	});

	const getTransform = (side, position) => {
		const adjust = boxSize / 2;
		const x = side === 'borderLeft' ? -adjust : adjust -20;
		const y = position === 'borderTop' ? -adjust : adjust -20;
		return `${x}px, ${y}px`;
	};

	return <div style={cornerStyle(side, position)} />;
};

export default CornerBox;
