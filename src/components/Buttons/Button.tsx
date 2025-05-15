import React from 'react';

import AnimatedLinkText from '@/components/Shared/AnimatedLinkText';

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

type Size = (
	'sm'
	| 'md'
	| 'lg'
	| 'xl'
	| '2xl'
);

type TextSize = (
	'sm'
	| 'md'
	| 'lg'
);

export type Props = {
	id?: string,
	type?: 'button' | 'reset' | 'submit',
	children?: React.ReactNode,
	onClick?: React.MouseEventHandler<HTMLButtonElement>,
	variant?: Variant,
	size?: Size,
	square?: boolean,
	textSize?: TextSize,
	additionalClassName?: string,
	disabled?: boolean,
	ariaLabel?: string,
	title?: string,
	linkLineSize?: 'regular-small' | 'small' | 'mid' | 'large',
	linkClassName?: string,
};

const Button = ({
	id,
	type = 'button',
	children,
	onClick,
	variant = 'custom',
	size = 'md',
	square = false,
	textSize = 'sm',
	additionalClassName = '',
	disabled = false,
	ariaLabel,
	title,
	linkLineSize = 'regular-small',
	linkClassName = 'text-c-lm-gray-900 dark:text-c-dm-gray-100',
}: Props) => {

	if (variant === 'link') {
		return (
			<button 
			id={id}
			type={type}
			{...(onClick && { onClick: onClick })}
			{...(disabled && { disabled })}
			className={`${additionalClassName} group`}
			{...(ariaLabel && { 'aria-label': ariaLabel })}
			{...(title && { title })}
			>
					<AnimatedLinkText
					className={linkClassName}
					size={linkLineSize}
					text={children}
					/>
			</button>
		)
	}

	const getVariantClassName = () => {
		let sizeClasses = '';
		if (size === 'sm') {
			sizeClasses = square ? 'p-1' : 'px-3 py-1';
		} else if (size === 'md') {
			sizeClasses = square ? 'p-2' : 'px-4 py-2';
		} else if (size === 'lg') {
			sizeClasses = square ? 'px-3 py-[calc(0.625rem+1px)]' : 'px-5 py-[calc(0.625rem+1px)]';
		} else if (size === 'xl') {
			sizeClasses = square ? 'p-3.5' : 'px-6 py-3.5';
		} else if (size === '2xl') {
			sizeClasses = square ? 'p-5' : 'px-8 py-5';
		} else {
			sizeClasses = square ? 'p-2' : 'px-4 py-2';
		}

		let textSizeClasses = '';
		if (textSize === 'sm') {
			textSizeClasses = 'text-sm';
		} else if (textSize === 'md') {
			textSizeClasses = 'text-md';
		} else if (textSize === 'lg') {
			textSizeClasses = 'text-lg';
		}

		const commonClasses = `rounded-lg shadow-sm text-center font-medium flex flex-row flex-nowrap items-center justify-center ${textSizeClasses}`;

		switch (variant) {
			case 'primary':
				return `${commonClasses} ${sizeClasses} text-white ${!disabled ? "bg-primary hover:bg-primary-hover dark:text-white dark:hover:bg-primary-light-hover dark:bg-primary-light" : "bg-gray-300 cursor-not-allowed hover:bg-gray-300"}`;
			case 'secondary':
				return `${commonClasses} ${sizeClasses} text-white ${!disabled ? "bg-primary-light hover:bg-primary-light-hover dark:bg-extra-light dark:hover:bg-primary-light" : "bg-gray-300 cursor-not-allowed hover:bg-gray-300"}`;
			case 'tertiary':
				return `${commonClasses} ${sizeClasses} ${!disabled ? "text-c-lm-gray-100 dark:text-c-dm-gray-900 bg-c-lm-gray-900 dark:bg-c-dm-gray-100 hover:bg-c-lm-gray-800 dark:hover:bg-c-dm-gray-200 transition-all duration-150" : "text-c-lm-gray-600 dark:text-c-dm-gray-900 bg-c-lm-gray-300 dark:bg-c-dm-gray-700 cursor-not-allowed"}`;
			case 'cancel':
				return `${commonClasses} ${sizeClasses} ${!disabled ? "text-c-lm-gray-900 dark:text-c-dm-gray-100 bg-c-lm-gray-300 dark:bg-c-dm-gray-700 hover:bg-c-lm-gray-400 dark:hover:bg-c-dm-gray-600 transition-all duration-150" : "text-c-lm-gray-600 dark:text-c-dm-gray-900 bg-c-lm-gray-300 dark:bg-c-dm-gray-700 cursor-not-allowed"}`;
			case 'delete':
				return `${commonClasses} ${sizeClasses} ${!disabled ? "text-c-lm-red dark:text-c-dm-red bg-c-lm-red-bg dark:bg-c-dm-red-bg hover:bg-c-lm-red-bg-hover dark:hover:bg-c-dm-red-bg-hover transition-all duration-150" : "text-c-lm-red dark:text-c-dm-red bg-c-lm-red-bg dark:bg-c-dm-red-bg cursor-not-allowed"}`;
			case 'outline':
				return `${sizeClasses} rounded-xl shadow-sm ${!disabled ? 'cursor-pointer text-c-lm-gray-900 dark:text-c-dm-gray-100 bg-c-lm-gray-300 dark:bg-c-dm-gray-700 hover:bg-c-lm-gray-400 dark:hover:bg-c-dm-gray-600 transition-all duration-150' : 'text-c-lm-gray-600 dark:text-c-dm-gray-900 bg-c-lm-gray-300 dark:bg-c-dm-gray-700 border border-c-lm-gray-400 dark:border-c-dm-gray-600 cursor-not-allowed'}`;
			default:
				return `${commonClasses} ${sizeClasses}`;
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
			{...(title && { title })}
		>
			{children}
		</button>
	);
};

export default Button;
