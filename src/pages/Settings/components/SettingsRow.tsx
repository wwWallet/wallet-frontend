import React, { ReactNode } from 'react';

const SettingsRow = ({
	title,
	description,
	children,
}: {
	title?: ReactNode,
	description?: ReactNode,
	children: ReactNode,
}) => (
	<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
		<div>
			{title && (
				<p className="font-medium text-lm-gray-900 dark:text-white">{title}</p>
			)}
			{description && (
				<p className={`text-md text-lm-gray-800 dark:text-dm-gray-200 ${title ? 'mt-0.5' : ''}`}>{description}</p>
			)}
		</div>
		<div className="shrink-0">{children}</div>
	</div>
);

export default SettingsRow;
