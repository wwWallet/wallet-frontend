import { describe, expect, it } from 'vitest';

import { resolveLoginRedirect, withLoginRedirect } from './loginRedirect';

describe('withLoginRedirect', () => {
	it('records a known route as a token, keeping the existing params', () => {
		const params = new URLSearchParams(withLoginRedirect('/settings', '?tab=privacy'));
		expect(params.get('redirect')).toBe('settings');
		expect(params.get('tab')).toBe('privacy');
	});

	it('records a known route that carries no params of its own', () => {
		expect(withLoginRedirect('/settings', '')).toBe('?redirect=settings');
	});

	it('leaves the search untouched for routes with no token', () => {
		expect(withLoginRedirect('/add', '?credential_offer=abc')).toBe('?credential_offer=abc');
		expect(withLoginRedirect('/', '')).toBe('');
	});
});

describe('resolveLoginRedirect', () => {
	it('restores a known route and drops the token', () => {
		expect(resolveLoginRedirect('?redirect=settings&tab=privacy')).toBe('/settings?tab=privacy');
		expect(resolveLoginRedirect('?redirect=settings')).toBe('/settings');
	});

	it('falls back to home, keeping the remaining params', () => {
		expect(resolveLoginRedirect('?credential_offer=abc')).toBe('/?credential_offer=abc');
		expect(resolveLoginRedirect('')).toBe('/');
	});

	it('rejects unknown tokens', () => {
		expect(resolveLoginRedirect('?redirect=add')).toBe('/');
		expect(resolveLoginRedirect('?redirect=')).toBe('/');
	});

	it('rejects tokens inherited from Object.prototype', () => {
		expect(resolveLoginRedirect('?redirect=__proto__')).toBe('/');
		expect(resolveLoginRedirect('?redirect=constructor')).toBe('/');
		expect(resolveLoginRedirect('?redirect=toString')).toBe('/');
	});

	it('rejects anything URL-shaped, including a bare path', () => {
		expect(resolveLoginRedirect('?redirect=%2Fsettings')).toBe('/');
		expect(resolveLoginRedirect('?redirect=https%3A%2F%2Fevil.com%2Fsettings')).toBe('/');
		expect(resolveLoginRedirect('?redirect=%2F%2Fevil.com%2Fsettings')).toBe('/');
		expect(resolveLoginRedirect('?redirect=%2F%5Cevil.com%2Fsettings')).toBe('/');
		expect(resolveLoginRedirect('?redirect=javascript%3Aalert(1)')).toBe('/');
	});

	it('drops params the target does not declare', () => {
		expect(resolveLoginRedirect('?redirect=settings&credential_offer=abc')).toBe('/settings');
		expect(resolveLoginRedirect('?redirect=settings&code=abc&state=xyz')).toBe('/settings');
		expect(resolveLoginRedirect('?redirect=settings&tab=privacy&credential_offer=abc'))
			.toBe('/settings?tab=privacy');
	});

	it('drops declared params whose value fails validation', () => {
		expect(resolveLoginRedirect('?redirect=settings&tab=evil')).toBe('/settings');
		expect(resolveLoginRedirect('?redirect=settings&tab=')).toBe('/settings');
	});

	it('always lands on a known same-origin route', () => {
		const hostile = [
			'/settings', '//evil.com/settings', '/\\evil.com/settings',
			// eslint-disable-next-line no-script-url -- rejecting this is the point
			'https://evil.com/settings', 'javascript:alert(1)', 'http://[',
			'__proto__', 'constructor', '', '   ', '%%%', 'settings',
		];

		for (const target of hostile) {
			const result = resolveLoginRedirect(`?redirect=${encodeURIComponent(target)}`);
			const url = new URL(result, window.location.origin);
			expect(url.origin).toBe(window.location.origin);
			expect(['/', '/settings']).toContain(url.pathname);
		}
	});
});

describe('withLoginRedirect + resolveLoginRedirect', () => {
	const roundTrip = (pathname: string, search: string) => (
		resolveLoginRedirect(withLoginRedirect(pathname, search))
	);

	it('restores exactly what it recorded', () => {
		expect(roundTrip('/settings', '?tab=privacy')).toBe('/settings?tab=privacy');
		expect(roundTrip('/settings', '?tab=account')).toBe('/settings?tab=account');
		expect(roundTrip('/settings', '')).toBe('/settings');
	});

	it('leaves routes it cannot restore on the home page, params intact', () => {
		expect(roundTrip('/add', '?credential_offer=abc')).toBe('/?credential_offer=abc');
		expect(roundTrip('/', '')).toBe('/');
	});
});
