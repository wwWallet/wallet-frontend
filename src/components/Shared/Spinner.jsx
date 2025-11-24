import React from 'react';
import Logo from '../Logo/Logo';
import { LoaderCircle } from 'lucide-react';

const Spinner = ({ size = 'large' }) => {

	const sizes = {
		'large': {
			container: 'h-40 w-40',
			image: 'w-30',
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
		<div className="flex justify-center items-center h-[100dvh] bg-c-lm-gray-200 dark:bg-c-dm-gray-800" role="status" aria-live="polite">
			<div className={`relative ${currentSize.container}`}>
				<LoaderCircle strokeWidth={1.25} className={`absolute rounded-full ${currentSize.container} animate-spin ${currentSize.opacity}`} />
				<div className={`absolute inset-0 scale-50 flex items-center justify-center ${currentSize.opacity}`}>
					<Logo clickable={false} alt="Loading..." imgClassName={`${currentSize.image}`} />
				</div>
			</div>
		</div>
	);
};

export default Spinner;
