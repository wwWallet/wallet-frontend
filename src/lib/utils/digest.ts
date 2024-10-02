export async function calculateHash(text: string) {
	const encoder = new TextEncoder();
	const data = encoder.encode(text);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const base64String = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
	const base64UrlString = base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
	return base64UrlString;
}