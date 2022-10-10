import React from 'react';
import './Tooltip.css';

export interface TooltipProps {
	tip: string,
	children: JSX.Element;
}

const Tooltip: React.FC<TooltipProps> = ({ tip, children }) => {
	return (
		<span data-tip={tip} className="Tooltip">
			{children}
		</span>
	);
}

export default Tooltip;