import React from 'react';

export type Variant = (
	'primary'
	| 'secondary'
	| 'tertiary'
	| 'delete'
	| 'invisible'
	| 'outline'
	| 'link'
	| 'custom'
	| 'default'
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
	linkClassName?: string,
	value?: string;
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
	linkClassName = 'text-lm-gray-900 dark:text-dm-gray-100',
	value,
}: Props) => {

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
				return `${commonClasses} ${sizeClasses} text-white dark:text-dm-gray-900 bg-lm-gray-900 dark:bg-dm-gray-100 border-lm-gray-900 dark:border-dm-gray-800`;
			case 'delete':
				return `${commonClasses} ${sizeClasses} text-lm-red-light dark:text-dm-red-light bg-lm-red-dark dark:bg-dm-red-dark border-lm-red-dark dark:border-dm-red-dark`;
			case 'invisible':
				return `${commonClasses} ${sizeClasses} text-inherit bg-inherit border-none ${!disabled ? 'hover:bg-brand-lighter dark:hover:bg-brand-darker' : ''}`;
			case 'outline':
				return `${commonClasses} ${sizeClasses} text-lm-gray-900 dark:text-white bg-lm-gray-200 dark:bg-dm-gray-800 border-lm-gray-700 dark:border-dm-gray-400`;
			case 'link':
				return `${linkClassName} underline ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:decoration-2 transition'}`;
			default:
				return `${commonClasses} ${sizeClasses} test-black dark:text-white bg-brand-lighter dark:bg-brand-darker border-lm-gray-600 dark:border-dm-gray-400`;
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
			{...(value && { value })}
		>
			{children}
		</button>
	);
};

export default Button;
