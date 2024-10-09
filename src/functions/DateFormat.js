export function formatDate(value, format = 'datetime') {
	// Regex for ISO 8601 format like '2024-10-08T07:28:49.117Z'
	const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
	// Regex for simple YYYY-MM-DD format
	const simpleDateRegex = /^\d{4}-\d{2}-\d{2}$/;

	let date;
	if (iso8601Regex.test(value)) {
		date = new Date(value);
	} else if (simpleDateRegex.test(value)) {
		date = new Date(value);
	} else {
		return value;
	}
	const options = format === 'datetime'
		? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }
		: { day: '2-digit', month: '2-digit', year: 'numeric' };

	return date.toLocaleDateString('en-GB', options);
}
