export function truncateByWords(input: string, maxLength: number): { text: string; truncated: boolean } {
	const words = input.split(' ');
	let currentLength = 0;
	const result = words.reduce((acc, word) => {
		if (currentLength + word.length + 1 <= maxLength) {
			currentLength += word.length + 1;
			return [...acc, word];
		}
		return acc;
	}, [] as string[]);

	const joined = result.join(' ');
	return {
		text: joined !== input ? joined + '...' : joined,
		truncated: joined !== input,
	};
}
