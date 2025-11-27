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

		const disabledClasses = !disabled ? 'hover:cursor-pointer hover:brightness-[0.85] dark:hover:brightness-[1.15]' : 'grayscale opacity-75 cursor-not-allowed';
		const commonClasses = `rounded-lg shadow-xs text-center font-medium flex flex-row flex-nowrap items-center justify-center gap-2 border transition-color duration-150 ${textSizeClasses} ${disabledClasses}`;

		switch (variant) {
			case 'primary':
				return `${commonClasses} ${sizeClasses} text-white bg-primary border-primary`;
			case 'secondary':
				return `${commonClasses} ${sizeClasses} text-white dark:text-white bg-brand-light dark:bg-brand-dark border-brand-light dark:border-brand-dark`;
			case 'tertiary':
				return `${commonClasses} ${sizeClasses} text-white dark:text-c-dm-gray-900 bg-c-lm-gray-900 dark:bg-c-dm-gray-100 border-c-lm-gray-900 dark:border-c-dm-gray-800`;
			case 'delete':
				return `${commonClasses} ${sizeClasses} text-c-lm-red-light dark:text-c-dm-red-light bg-c-lm-red-dark dark:bg-c-dm-red-dark border-c-lm-red-dark dark:border-c-dm-red-dark`;
			case 'outline':
				return `${commonClasses} ${sizeClasses} test-black dark:text-white bg-c-lm-gray-200 dark:bg-c-dm-gray-800 border-c-lm-gray-600 dark:border-c-dm-gray-400`;
			default:
				return `${commonClasses} ${sizeClasses} text-c-lm-gray-900 dark:text-c-dm-gray-50 bg-brand-lighter dark:bg-brand-darker border-brand-lighter dark:border-brand-darker`;
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
