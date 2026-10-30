import React from 'react';

export type Variant = 'primary' | 'secondary' | 'delete' | 'invisible' | 'outline' | 'custom' | 'default';

type Size = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

type TextSize = 'sm' | 'md' | 'lg';

export type Props = {
	id?: string;
	type?: 'button' | 'reset' | 'submit';
	children?: React.ReactNode;
	onClick?: React.MouseEventHandler<HTMLButtonElement>;
	variant?: Variant;
	size?: Size;
	square?: boolean;
	textSize?: TextSize;
	additionalClassName?: string;
	disabled?: boolean;
	ariaLabel?: string;
	ariaExpanded?: boolean;
	ariaControls?: string;
	title?: string;
	value?: string;
};

const Button = React.forwardRef<HTMLButtonElement, Props>(function Button(
	{
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
		ariaExpanded,
		ariaControls,
		title,
		value,
	},
	ref,
) {
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

		const disabledClasses = !disabled ? 'hover:cursor-pointer' : 'grayscale opacity-75 cursor-not-allowed';
		const commonClasses = `rounded-lg shadow-xs text-center font-medium flex flex-row flex-nowrap items-center justify-center gap-2 border transition-color duration-150 ${textSizeClasses} ${disabledClasses}`;

		switch (variant) {
			case 'primary':
				return `${commonClasses} ${sizeClasses} text-white bg-primary border-primary enabled:hover:bg-primary-hover enabled:hover:border-primary-hover dark:enabled:hover:bg-primary-hover-dark dark:enabled:hover:border-primary-hover-dark`;
			case 'secondary':
				return `${commonClasses} ${sizeClasses} text-white dark:text-white bg-brand-light dark:bg-brand-dark border-brand-light dark:border-brand-dark enabled:hover:bg-brand-light-hover enabled:hover:border-brand-light-hover dark:enabled:hover:bg-brand-dark-hover dark:enabled:hover:border-brand-dark-hover`;
			case 'delete':
				return `${commonClasses} ${sizeClasses} text-white bg-lm-red-dark dark:bg-dm-red-dark border-lm-red-dark dark:border-dm-red-dark enabled:hover:bg-lm-red-dark-hover enabled:hover:border-lm-red-dark-hover dark:enabled:hover:bg-dm-red-dark-hover dark:enabled:hover:border-dm-red-dark-hover`;
			case 'invisible':
				return `${commonClasses} ${sizeClasses} text-inherit bg-inherit border-none enabled:hover:bg-brand-lighter-hover dark:enabled:hover:bg-brand-darker-hover`;
			case 'outline':
				return `${commonClasses} ${sizeClasses} text-lm-gray-900 dark:text-white bg-lm-gray-200 dark:bg-dm-gray-800 border-lm-gray-700 dark:border-dm-gray-400 enabled:hover:bg-lm-gray-200-hover enabled:hover:border-lm-gray-700-hover dark:enabled:hover:bg-dm-gray-800-hover dark:enabled:hover:border-dm-gray-400-hover`;
			default:
				return `${commonClasses} ${sizeClasses} test-black dark:text-white bg-brand-lighter dark:bg-brand-darker border-lm-gray-600 dark:border-dm-gray-400 enabled:hover:bg-brand-lighter-hover enabled:hover:border-lm-gray-600-hover dark:enabled:hover:bg-brand-darker-hover dark:enabled:hover:border-dm-gray-400-hover`;
		}
	};

	const focusVisibleClasses = 'focus-visible:outline-2 focus-visible:outline-offset-2';
	const className = `${getVariantClassName()} ${focusVisibleClasses} ${additionalClassName}`;

	return (
		<button
			ref={ref}
			id={id}
			type={type}
			{...(onClick && { onClick: onClick })}
			{...(disabled && { disabled })}
			className={className}
			{...(ariaLabel && { 'aria-label': ariaLabel })}
			// Check for undefined so aria-expanded="false" is still rendered.
			{...(ariaExpanded !== undefined && { 'aria-expanded': ariaExpanded })}
			{...(ariaControls && { 'aria-controls': ariaControls })}
			{...(title && { title })}
			{...(value && { value })}
		>
			{children}
		</button>
	);
});

export default Button;
