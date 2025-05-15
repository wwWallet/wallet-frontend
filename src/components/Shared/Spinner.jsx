import React from 'react';

import { useTheme } from '@/context/ThemeContextProvider';

const Spinner = ({ size = 'large' }) => {
	const { selectedTheme } = useTheme();
	
	const activeTheme = selectedTheme.value === "system" ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' : selectedTheme.value;

	const sizes = {
		'large': {
			container: 'h-40 w-40',
			border: 'w-[62px] h-[62px] border-[5px]',
			video: 'w-64 h-64',
			image: 'w-16',
			opacity: 'opacity-100',
		},
		'small': {
			container: 'h-32 w-32',
			border: 'w-[50px] h-[50px] border-[4.3px]',
			video: 'w-48 h-48',
			image: 'w-12',
			opacity: 'opacity-75',
		},
	};

	const currentSize = sizes[size] || sizes.large;

	return (
		<div className="flex justify-center items-center h-[100dvh]" role="status" aria-live="polite">
			<div className={`relative ${currentSize.container} ${currentSize.opacity}`}>
				<div className='absolute inset-0 flex items-center justify-center'>
					<div
					className={`${currentSize.border} rounded-full border-c-lm-gray-300 dark:border-c-dm-gray-600`}
					/>
				</div>

				<div className={`absolute inset-0 flex items-center justify-center`}>
					<video 
					autoPlay 
					loop 
					muted 
					playsInline 
					src={activeTheme === 'dark' ? '/loading-spin-white.webm' : '/loading-spin-blue.webm'}
					alt="Loading..." 
					className={`object-contain ${currentSize.video}`} 
					/>
				</div>

				<div className={`absolute inset-0 flex items-center justify-center`}>
					<img 
					src={activeTheme === 'dark' ? '/logo_white.png' : '/logo.png'} 
					alt="wwWallet" 
					className={`object-contain ${currentSize.image}`} 
					/>
				</div>
			</div>
		</div>
	);
};

export default Spinner;
