import React from 'react';

export type Variant = (
	'primary'
	| 'secondary'
	| 'tertiary'
	| 'cancel'
	| 'delete'
	| 'outline'
	| 'link'
	| 'custom'
);

export type Props = {
	id?: string,
	type?: 'button' | 'reset' | 'submit',
	children?: React.ReactNode,
	onClick?: React.MouseEventHandler<HTMLButtonElement>,
	variant?: Variant,
	additionalClassName?: string,
	disabled?: boolean,
	ariaLabel?: string,
	name?: string,
	title?: string,
	value?: string,
};

const Button = ({
	id,
	type = 'button',
	children,
	onClick,
	variant = 'custom',
	additionalClassName = '',
	disabled = false,
	ariaLabel,
	name,
	title,
	value,
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
			case 'outline':
				return `bg-white px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white ${!disabled ? 'cursor-pointer' : 'text-gray-300 border-gray-300 dark:text-gray-700 dark:border-gray-700 cursor-not-allowed'}`;
			case 'link':
				return `font-medium ${!disabled ? "text-primary dark:text-primary-light hover:underline" : "text-gray-400 cursor-not-allowed"}`;
			default:
				return `${commonClasses}`;
		}
	};

	const focusVisibleClasses = 'focus-visible:outline-2 focus-visible:outline-offset-2';
	const className = `${getVariantClassName()} ${focusVisibleClasses} ${additionalClassName}`;

	return (
		<button
			id={id}
			type={type}
			{...(onClick && { onClick: onClick })}
			{...(disabled && { disabled })}
			className={className}
			{...(ariaLabel && { 'aria-label': ariaLabel })}
			{...(name && { name })}
			{...(title && { title })}
			{...(value && { value })}
		>
			{children}
		</button>
	);
};

export default Button;
