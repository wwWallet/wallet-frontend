export function generateRandomIdentifier(length: number) {
	const array = new Uint8Array(length);
	window.crypto.getRandomValues(array);
	return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
