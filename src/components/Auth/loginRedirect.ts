import { SETTINGS_TAB_IDS } from '@/pages/Settings/tabs';

const LOGIN_REDIRECT_PARAM = 'redirect';

type RedirectTarget = {
	path: string,
	params: Record<string, readonly string[]>,
};

/**
 * The routes that may be restored after login, keyed by the opaque token that
 * travels in the URL. Nothing user-supplied is ever parsed as a URL or used to
 * build a path
 */
const REDIRECT_TARGETS = new Map<string, RedirectTarget>([
	['settings', { path: '/settings', params: { tab: SETTINGS_TAB_IDS } }],
]);

function tokenForPath(pathname: string): string | null {
	for (const [token, target] of REDIRECT_TARGETS) {
		if (target.path === pathname) {
			return token;
		}
	}
	return null;
}

export function withLoginRedirect(pathname: string, search: string): string {
	const token = tokenForPath(pathname);
	if (!token) {
		return search;
	}

	const params = new URLSearchParams(search);
	params.set(LOGIN_REDIRECT_PARAM, token);
	return `?${params.toString()}`;
}

/**
 * Resolve where to send a freshly authenticated user, given the login page's
 * query string. Returns the requested route if its token is a known one, and
 * otherwise the home page carrying the remaining params.
 */
export function resolveLoginRedirect(search: string): string {
	const params = new URLSearchParams(search);
	const token = params.get(LOGIN_REDIRECT_PARAM);

	params.delete(LOGIN_REDIRECT_PARAM);
	const rest = params.toString();
	const fallback = rest ? `/?${rest}` : '/';

	const target = token && REDIRECT_TARGETS.get(token);
	if (!target) {
		return fallback;
	}

	// Rebuild the query
	const restored = new URLSearchParams();
	for (const [name, allowedValues] of Object.entries(target.params)) {
		const value = params.get(name);
		if (value !== null && allowedValues.includes(value)) {
			restored.set(name, value);
		}
	}

	const query = restored.toString();
	return query ? `${target.path}?${query}` : target.path;
}
