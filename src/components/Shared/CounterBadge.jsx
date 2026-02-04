import React from 'react';

/**
 * CounterBadge
 * - Hides itself when count <= 0 or not a number
 * - Caps display with `max` (e.g., 99+)
 * - `active` toggles color scheme to match active nav items
 * - `position` lets you place it easily (e.g., absolute top-right for bottom nav)
 */
export default function CounterBadge({
	count,
	max = 99,
	active = false,
	position = 'inline', // 'inline' | 'top-right' | 'top-left'
	className = '',
	ariaLabel = 'pending',
	title, // optional: override tooltip
}) {
	const n = typeof count === 'number' ? count : 0;
	if (n <= 0) return null;

	const text = n > max ? `${max}+` : `${n}`;
	const base =
		'inline-flex items-center justify-center min-w-6 h-6 px-2 text-xs font-semibold rounded-full';
	const scheme = active
		? 'bg-orange-500 text-white'
		: 'bg-orange-500 text-white';
	const posClass =
		position === 'top-right'
			? 'absolute -top-2 -right-2'
			: position === 'top-left'
				? 'absolute -top-2 -left-2'
				: '';

	return (
		<span
			className={[base, scheme, posClass, className].join(' ')}
			aria-label={`${text} ${ariaLabel}`}
			title={title ?? `${text} ${ariaLabel}`}
		>
			{text}
		</span>
	);
}
