import { DEV_MODE } from '@/config';

export function safeRedirect(url?: string | null) {
	try {
		const { protocol } = new URL(url!);
		if (protocol === 'https:' || (DEV_MODE && protocol === 'http:')) {
			window.location.href = url!;
			return;
		}
	} catch {
		// invalid URL: fall through and block
	}
	console.error('Blocked redirect to unsafe URL:', url);
}
