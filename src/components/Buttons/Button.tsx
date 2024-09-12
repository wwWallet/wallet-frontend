import React from 'react';

export type Variant = (
	'primary'
	| 'secondary'
	| 'tertiary'
	| 'cancel'
	| 'delete'
	| 'custom'
);

export type Props = {
	type?: 'button' | 'reset' | 'submit',
	content: React.ReactNode,
	onClick?: React.MouseEventHandler<HTMLButtonElement>,
	variant?: Variant,
	additionalClassName?: string,
	disabled?: boolean,
	ariaLabel?: string,
	title?: string,
};

const Button = ({
	type = 'button',
	content,
	onClick,
	variant = 'custom',
	additionalClassName = '',
	disabled = false,
	ariaLabel,
	title,
}: Props) => {

	const getVariantClassName = () => {
		const commonClasses = 'rounded-lg shadow-sm text-sm px-4 py-2 text-center flex flex-row flex-nowrap items-center justify-center';
		switch (variant) {
			case 'primary':
				return `${commonClasses} text-white ${!disabled ? "bg-primary hover:bg-primary-hover dark:text-white dark:hover:bg-primary-light-hover dark:bg-primary-light" : "bg-gray-300 cursor-not-allowed hover:bg-gray-300"}`;
			case 'secondary':
				return `${commonClasses} text-white ${!disabled ? "bg-primary-light hover:bg-primary-light-hover dark:bg-extra-light dark:hover:bg-primary-light" : "bg-gray-300 cursor-not-allowed hover:bg-gray-300"}`;
			case 'tertiary':
				return `${commonClasses} text-gray-700 bg-gray-100 hover:bg-gray-200`;
			case 'cancel':
				return `${commonClasses} ${!disabled ? "text-gray-900 bg-gray-300 hover:bg-gray-400" : "text-white bg-gray-300 cursor-not-allowed hover:bg-gray-300"}`;
			case 'delete':
				return `${commonClasses} ${!disabled ? "text-white bg-red-600 hover:bg-red-700" : "text-red-400 bg-gray-300 hover:bg-gray-300 cursor-not-allowed"}`;
			default:
				return `${commonClasses}`;
		}
	};

	const focusVisibleClasses = 'focus-visible:outline-2 focus-visible:outline-offset-2';
	const className = `${getVariantClassName()} ${focusVisibleClasses} ${additionalClassName}`;

	return (
		<button
			type={type}
			{...(onClick && { onClick: onClick })}
			{...(disabled && { disabled })}
			className={className}
			{...(ariaLabel && { 'aria-label': ariaLabel })}
			{...(title && { title })}
		>
			{content}
		</button>
	);
};

export default Button;
