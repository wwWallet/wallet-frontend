export function highlightBestSequence(text, search) {
	if (!text || !search) return text;

	const regex = new RegExp(`(${search})`, 'gi');
	return text.split(regex).map((part, i) =>
		regex.test(part) ? (
			<span key={i} className="font-bold text-lm-gray-900 dark:text-dm-gray-100">
				{part}
			</span>
		) : (
			<span key={i}>{part}</span>
		)
	);
}
