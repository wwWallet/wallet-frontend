import React from 'react';
import styled, { keyframes } from 'styled-components';

export interface SpinnerProps {
	cx: number,
	cy: number,
	r: number,
	className?: any;
}

const Spinner: React.FC<SpinnerProps> = ({ cx, cy, r }) => {

	const loop = keyframes`
		0% {
			stroke-dashoffset: 1px;
		}
		70%{
			stroke-dasharray: 20px;
		}
		100% {
			stroke-dashoffset: 111px;
		}
	`;

	const Circle = styled.circle`
		fill: none;
		stroke: #00c0f3;
		stroke-width: 3px;
		stroke-dasharray: 113px; /* 2*r*pi */
		stroke-dashoffset: 0;
		stroke-linecap: round;
		animation: ${loop} 4.5s linear 1 alternate-reverse;
		animation-iteration-count: infinite;
		opacity: 1;
		cx: ${cx};
		cy: ${cy};
		r: ${r};
	`;

	const Svg = styled.svg`
		width: ${cx * 2}px;
		height: ${cy * 2}px;
	`;

	return (
		<Svg>
			<Circle cx={cx} cy={cy} r={r} />
		</Svg>
	)
}

export default Spinner;