export function formatDateTime(dateTimeString) {
	const options = {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	};
	return new Date(dateTimeString).toLocaleString(undefined, options);
};
export function formatDate(dateString) {
	const options = {
		year: 'numeric',
		month: '2-digit',
		day: 'numeric',
	};
	return new Date(dateString).toLocaleString(undefined, options);
};
