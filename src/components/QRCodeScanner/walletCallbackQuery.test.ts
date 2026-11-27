import { describe, expect, it } from 'vitest';
import { walletCallbackQuery } from './walletCallbackQuery';

describe('walletCallbackQuery', () => {
	it.each([
		'openid-credential-offer://?credential_offer=%7B%22credentials%22%3A%5B%5D%7D',
		'openid-credential-offer://?credential_offer_uri=https%3A%2F%2Fissuer.example%2Foffer',
		'openid4vp://?client_id=wallet&request_uri=https://example.com/request?token=abc',
		'https://wallet.example/?client_id=wallet&request_uri=https%3A%2F%2Fexample.com%2Frequest',
	])('preserves the full query of %s', (data) => {
		expect(walletCallbackQuery(data)).toBe(data.slice(data.indexOf('?') + 1));
	});
	it.each([
		'plain text',
		'https://example.com',
		'WIFI:T:WPA;S:network;P:secret;;',
		'openid4vp://?client_id=wallet',
		'openid4vp://?request_uri=https://example.com/request',
		'openid-credential-offer://?credential_offer=',
		'?credential_offer=foo',
	])('rejects %s', (data) => {
		expect(walletCallbackQuery(data)).toBeNull();
	});
});
