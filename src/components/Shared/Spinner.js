import React from 'react';

const Spinner = () => {
	return (
		<div className="flex justify-center items-center h-[100dvh]" role="status" aria-live="polite">
			<div className="relative h-40 w-40">
				<div className="absolute rounded-full h-40 w-40 border-t-4 border-b-4 border-main-blue animate-spin"></div>
				<div className="absolute inset-0 flex items-center justify-center">
					<img src="/wallet_192.png" alt="Loading..." className="object-contain w-24" />
				</div>
			</div>
		</div>
	);
};

export default Spinner;
