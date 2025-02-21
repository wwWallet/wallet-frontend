export function formatDate(value: any, format = 'datetime') {
	// Regex for ISO 8601 format like '2024-10-08T07:28:49.117Z'
	const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
	// Regex for simple YYYY-MM-DD format
	const simpleDateRegex = /^\d{4}-\d{2}-\d{2}$/;
	// Regex for long-form date strings like 'Wed Dec 11 2024 14:46:19 GMT+0200'
	const longFormDateRegex = /^[A-Z][a-z]{2} [A-Z][a-z]{2} \d{2} \d{4} \d{2}:\d{2}:\d{2} GMT[+-]\d{4}/;

	let date;

	if (typeof value === 'number' && value.toString().length === 10) {
		// Handle Unix timestamp (seconds) by converting to milliseconds
		date = new Date(value * 1000);
	} else if (typeof value === 'string') {
		if (iso8601Regex.test(value)) {
			// Handle ISO 8601 format
			date = new Date(value);
		} else if (simpleDateRegex.test(value)) {
			// Handle YYYY-MM-DD format
			date = new Date(value);
		} else if (longFormDateRegex.test(value)) {
			// Handle long-form date string
			date = new Date(value);
		} else {
			// Non-date strings, including IDs, are returned as-is
			return value;
		}
	} else if (value instanceof Date) {
		// Handle Date objects directly
		date = value;
	} else {
		// For unsupported types, return the original value
		return value;
	}

	const options = format === 'datetime'
		? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }
		: { day: '2-digit', month: '2-digit', year: 'numeric' };

	return date.toLocaleDateString('en-GB', options as any);
}
