/**
 * Converts camelCase or PascalCase to space-separated words.
 * If input is missing or not a string, returns it unchanged and logs a warning.
 */
export const camelCaseToWords = (str?: string): string => {
	if (typeof str !== 'string' || !str) {
		console.warn('[camelCaseToWords] Invalid input:', str);
		return str || '';
	}

	return str.replace(/([a-z])([A-Z])/g, '$1 $2');
};
