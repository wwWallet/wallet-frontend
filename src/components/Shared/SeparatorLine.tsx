import type { ReactNode } from 'react';

interface SeparatorLineProps {
	children?: ReactNode;
}

function SeparatorLine({ children }: SeparatorLineProps) {
	return (
		<div className="flex items-center gap-4 text-sm font-medium text-lm-gray-600 dark:text-dm-gray-400">
			<div aria-hidden="true" className="h-px flex-1 bg-lm-gray-400 dark:bg-dm-gray-600" />
			{children && (
				<>
					<span className="shrink-0">{children}</span>
					<div aria-hidden="true" className="h-px flex-1 bg-lm-gray-400 dark:bg-dm-gray-600" />
				</>
			)}
		</div>
	);
}

export default SeparatorLine;
