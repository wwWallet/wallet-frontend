import React, { ReactNode, SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface SettingsSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
	icon?: ReactNode,
	children: ReactNode,
}

const SettingsSelect = ({ icon, className, children, ...selectProps }: SettingsSelectProps) => (
	<div className="relative inline-block min-w-36">
		{icon && (
			<span className="absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none dark:text-white">
				{icon}
			</span>
		)}
		<select
			className={`h-10 ${icon ? 'pl-10' : 'pl-3'} pr-10 bg-lm-gray-200 dark:bg-dm-gray-800 border border-lm-gray-600 dark:border-dm-gray-400 dark:text-white rounded-lg inputDarkModeOverride appearance-none ${className ?? ''}`}
			{...selectProps}
		>
			{children}
		</select>
		<span className="absolute top-1/2 right-2 -translate-y-1/2 pointer-events-none">
			<ChevronDown size={18} className="dark:text-white" />
		</span>
	</div>
);

export default SettingsSelect;
