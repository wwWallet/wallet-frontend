import React from 'react';

type CommonProps = {
	id?: string;
	children: React.ReactNode;
	disabled?: boolean;
	title?: string;
	className?: string;
};

type Props = CommonProps & (
	| { href: string; onClick?: never }
	| { href?: never; onClick: React.MouseEventHandler<HTMLButtonElement> }
);

const Link = ({
	id,
	children,
	href,
	onClick,
	disabled = false,
	title,
	className = '',
}: Props) => {
	const interactionClassName = disabled
		? 'grayscale opacity-75 cursor-not-allowed'
		: 'cursor-pointer hover:underline';
	const linkClassName = `text-lm-gray-900 dark:text-dm-gray-100 font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 ${interactionClassName} ${className}`;

	if (href !== undefined) {
		return (
			<a
				id={id}
				href={href}
				onClick={disabled ? (event) => event.preventDefault() : undefined}
				aria-disabled={disabled}
				tabIndex={disabled ? -1 : undefined}
				title={title}
				className={linkClassName}
			>
				{children}
			</a>
		);
	}

	return (
		<button
			id={id}
			type="button"
			onClick={onClick}
			disabled={disabled}
			title={title}
			className={linkClassName}
		>
			{children}
		</button>
	);
};

export default Link;
