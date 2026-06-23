import React, { ReactNode } from 'react';
import { H2 } from '../../../components/Shared/Heading';

const variantClassName = {
	default: 'border-lm-gray-300 dark:border-dm-gray-700 bg-white dark:bg-dm-gray-900',
	danger: 'border-lm-red/30 dark:border-dm-red/30 bg-lm-red/5 dark:bg-dm-red/10',
};

const SettingsSection = ({
	title,
	icon,
	actions,
	variant = 'default',
	card = true,
	children,
}: {
	title: ReactNode,
	icon?: ReactNode,
	actions?: ReactNode,
	variant?: 'default' | 'danger',
	card?: boolean,
	children: ReactNode,
}) => (
	<div>
		<H2
			hr={false}
			heading={
				<span className="flex items-center gap-2">
					{icon && <span className="text-lm-gray-700 dark:text-dm-gray-300">{icon}</span>}
					{title}
				</span>
			}
		>
			{actions}
		</H2>
		{card ? (
			<section className={`rounded-xl border p-4 sm:p-5 shadow-xs ${variantClassName[variant]}`}>
				{children}
			</section>
		) : children}
	</div>
);

export default SettingsSection;
