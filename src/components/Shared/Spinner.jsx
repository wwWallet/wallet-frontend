import React from 'react';
import Logo from '../Logo/Logo';
import { LoaderCircle } from 'lucide-react';

const Spinner = ({ size = 'large' }) => {

	const sizes = {
		'large': {
			container: 'h-32 w-32',
			image: 'w-32',
			opacity: 'opacity-100',
		},
		'small': {
			container: 'h-20 w-20',
			image: 'w-18',
			opacity: 'opacity-75',
		},
	};

	const currentSize = sizes[size] || sizes.large;

	return (
		<div className="flex justify-center items-center h-dvh w-dvw bg-lm-gray-200 dark:bg-dm-gray-900" role="status" aria-live="polite">
			<div className={`relative ${currentSize.container}`}>
				<LoaderCircle strokeWidth={1} className={`absolute rounded-full ${currentSize.container} text-brand-base dark:text-white animate-spin ${currentSize.opacity}`} />
				<div className={`absolute inset-0 scale-60 flex items-center justify-center ${currentSize.opacity}`}>
					<Logo clickable={false}  alt="Loading..." imgClassName={`${currentSize.image}`} />
				</div>
			</div>
		</div>
	);
};

export default Spinner;
