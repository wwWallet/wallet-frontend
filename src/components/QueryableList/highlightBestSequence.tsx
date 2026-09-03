import React from 'react';

export function highlightBestSequence(text, search) {
	if (!text || !search) return text;

	const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const regex = new RegExp(`(${escapedSearch})`, 'gi');
	const normalizedSearch = search.toLowerCase();

	return text.split(regex).map((part, i) =>
		part.toLowerCase() === normalizedSearch ? (
			<span key={i} className="font-bold text-lm-gray-900 dark:text-dm-gray-100">
				{part}
			</span>
		) : (
			<span key={i}>{part}</span>
		)
	);
}
