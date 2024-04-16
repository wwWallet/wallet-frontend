import React from 'react';

const GetButton = ({ type = 'button', content, onClick, variant = 'custom', additionalClassName = '', disabled = false, ariaLabel, title }) => {

	const getVariantClassName = () => {
		const commonClasses = 'rounded-lg shadow-sm text-sm px-4 py-2 text-center flex flex-row flex-nowrap items-center justify-center';
		switch (variant) {
			case 'primary':
				return `${commonClasses} text-white ${!disabled ? "bg-primary hover:bg-primary-hover" : "bg-gray-300 cursor-not-allowed hover:bg-gray-300"} dark:text-gray-900 dark:hover:bg-gray-300 dark:bg-secondary`;
			case 'secondary':
				return `${commonClasses} text-white ${!disabled ? "bg-secondary hover:bg-secondary-hover" : "bg-gray-300 cursor-not-allowed hover:bg-gray-300"} dark:bg-secondary dark:hover:bg-secondary-hover`;
			case 'tertiary':
				return `${commonClasses} text-gray-700 bg-gray-100 hover:bg-gray-200`;
			case 'cancel':
				return `${commonClasses} text-gray-900 bg-gray-300 hover:bg-gray-400 dark:text-gray-900 dark:hover:bg-gray-300 dark:bg-secondary`;
			case 'delete':
				return `${commonClasses} ${!disabled ? "text-white bg-red-600 hover:bg-red-700" : "text-red-400 bg-gray-300 hover:bg-gray-300 cursor-not-allowed"}`;
			case 'custom':
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

export default GetButton;
