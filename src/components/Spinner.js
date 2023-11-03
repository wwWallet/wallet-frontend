import React from 'react';
import logo from '../assets/images/logo.png';

function Spinner() {
	return (
		<div className="flex justify-center items-center h-screen">
			<div className="relative h-40 w-40">
				<div className="absolute animate-spin rounded-full h-40 w-40 border-t-4 border-b-4 border-main-blue"></div>
				<div className="absolute inset-0 flex items-center justify-center ">
					<img src={logo} className="object-contain w-24" alt="logo" />
				</div>
			</div>
		</div>
	);
}

export default Spinner;