import React, { useState, useEffect } from 'react';
import logo from '../../assets/images/logo.png';

function Spinner() {
	const [imageLoaded, setImageLoaded] = useState(false);

	useEffect(() => {
		const img = new Image();
		img.src = logo;
		img.onload = () => setImageLoaded(true);
	}, []);

	return (
		<div className="flex justify-center items-center h-screen" role="status" aria-live="polite">
			<div className="relative h-40 w-40">
				<div className={`absolute rounded-full h-40 w-40 border-t-4 border-b-4 border-main-blue ${imageLoaded ? 'animate-spin' : ''}`}></div>
				<div className={`absolute inset-0 flex items-center justify-center ${!imageLoaded && 'opacity-0'}`}>
					<img src={logo} className="object-contain w-24" alt="Loading..." onLoad={() => setImageLoaded(true)} />
				</div>
			</div>
		</div>
	);
}

export default Spinner;
