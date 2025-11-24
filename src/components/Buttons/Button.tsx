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
			sizeClasses = square ? 'px-3 ' : 'px-5 py-3';
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

		const commonClasses = `rounded-lg shadow-sm text-center font-medium flex flex-row flex-nowrap items-center justify-center gap-2 border transition-color duration-150 ${textSizeClasses}`;
		const disabledClasses = 'grayscale opacity-80 cursor-not-allowed';

		switch (variant) {
			case 'primary':
				return `${commonClasses} ${sizeClasses} text-white bg-primary border-primary ${!disabled ? "hover:bg-primary-hover hover:border-primary-hover" : disabledClasses}`;
			case 'secondary':
				return `${commonClasses} ${sizeClasses} text-white dark:text-black bg-primary-light dark:bg-extra-light border-primary-light dark:border-extra-light ${!disabled ? "dark:hover:text-white hover:bg-primary hover:border-primary dark:hover:bg-primary-light dark:hover:border-primary-light" : disabledClasses}`;
			case 'tertiary':
				return `${commonClasses} ${sizeClasses} text-c-lm-gray-100 dark:text-c-dm-gray-900 bg-c-lm-gray-900 dark:bg-c-dm-gray-100 border-c-lm-gray-900 dark:border-c-dm-gray-800 ${!disabled ? "hover:bg-c-lm-gray-800 dark:hover:bg-c-dm-gray-200 hover:border-c-lm-gray-800 dark:hover:border-clm-gray-200" : disabledClasses}`;
			case 'delete':
				return `${commonClasses} ${sizeClasses} text-c-lm-red-light dark:text-c-dm-red-light bg-c-lm-red-dark dark:bg-c-dm-red-dark border-c-lm-red-dark dark:border-c-dm-red-dark ${!disabled ? "hover:bg-c-lm-red-dark-hover dark:hover:bg-c-dm-red-dark-hover hover:border-c-lm-red-dark-hover dark:hover:border-c-dm-red-dark-hover" : disabledClasses}`;
			case 'outline':
				return `${commonClasses} ${sizeClasses} text-c-lm-gray-900 dark:text-c-dm-gray-100 bg-c-lm-gray-200 dark:bg-c-dm-gray-800 border-c-lm-gray-600 dark:border-c-dm-gray-400 ${!disabled ? 'hover:bg-c-lm-gray-500 dark:hover:bg-c-dm-gray-500' : disabledClasses}`;
			default:
				return `${commonClasses} ${sizeClasses} text-c-lm-gray-900 dark:text-c-dm-gray-100 bg-c-lm-gray-600 dark:bg-c-dm-gray-500 border-c-lm-gray-600 dark:border-c-dm-gray-500 ${!disabled ? "hover:bg-c-lm-gray-500 dark:hover:bg-c-dm-gray-600 hover:border-c-lm-gray-400 dark:hover:border-c-dm-gray-600" : disabledClasses}`;
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
