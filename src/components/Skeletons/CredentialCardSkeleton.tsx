/**
 * @file CredentialCardSkeleton.tsx
 * @description Loading skeleton for a credential card with 829x504 aspect ratio.
 */

// External dependencies
import React from 'react';

const CredentialCardSkeleton = () => (
	<div className="animate-pulse bg-gradient-to-tr from-gray-200 via-gray-300 to-gray-400 dark:from-gray-500 dark:via-gray-600 dark:to-gray-600 shadow-md rounded-xl overflow-hidden aspect-[829/504] w-full">
		<div className="h-[60%] w-full bg-transparent"></div>
		<div className="flex flex-col justify-around h-[40%] px-4 py-3 space-y-2">
			<div className="h-[30%] w-3/4 bg-white/30 dark:bg-white/15 rounded"></div>
			<div className="h-[30%] w-1/2 bg-white/20 dark:bg-white/10 rounded"></div>
		</div>
	</div>
);

export default CredentialCardSkeleton;
