export function highlightBestSequence(text, search) {
	if (!text || !search) return text;

	const regex = new RegExp(`(${search})`, 'gi');
	return text.split(regex).map((part, i) =>
		regex.test(part) ? (
			<span key={i} className="font-bold text-primary dark:text-primary-light">
				{part}
			</span>
		) : (
			<span key={i}>{part}</span>
		)
	);
}
