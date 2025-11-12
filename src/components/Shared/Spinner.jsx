import React from 'react';
import Logo from '../Logo/Logo';

const Spinner = ({ size = 'large' }) => {

	const sizes = {
		'large': {
			container: 'h-40 w-40',
			image: 'w-24',
			opacity: 'opacity-100',
		},
		'small': {
			container: 'h-20 w-20',
			image: 'w-12',
			opacity: 'opacity-50',
		},
	};

	const currentSize = sizes[size] || sizes.large;

	return (
		<div className="flex justify-center items-center h-[100dvh] bg-gray-100 dark:bg-gray-800" role="status" aria-live="polite">
			<div className={`relative ${currentSize.container}`}>
				<div className={`absolute rounded-full ${currentSize.container} border-t-4 border-b-4 animate-spin ${currentSize.opacity}`} />
				<div className={`absolute inset-0 flex items-center justify-center ${currentSize.opacity}`}>
					<Logo clickable={false} alt="Loading..." imgClassName={`object-contain ${currentSize.image}`} />
				</div>
			</div>
		</div>
	);
};

export default Spinner;
