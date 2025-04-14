/**
 * @file CredentialInfoSkeleton.tsx
 * Compact skeleton placeholder for credential fields (label + value) using flex layout.
 */

import React from 'react';

const CredentialInfoSkeleton = ({ rowCount = 5 }) => (
	<div className="text-sm lg:text-base w-full animate-pulse space-y-3" data-testid="credential-info-skeleton">
		{Array.from({ length: rowCount }).map((_, idx) => (
			<div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
				<div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded mb-1 sm:mb-0" />
				<div className="h-4 w-full max-w-[70%] bg-gray-200 dark:bg-gray-700 rounded" />
			</div>
		))}
	</div>
);

export default CredentialInfoSkeleton;
