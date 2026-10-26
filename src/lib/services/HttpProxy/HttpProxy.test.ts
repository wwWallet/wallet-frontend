import { renderHook } from '@testing-library/react';
import axios, { AxiosError, AxiosHeaders } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useHttpProxy } from './HttpProxy';

const mocks = vi.hoisted(() => ({
	encryptedHttpRequest: vi.fn(),
	obliviousKeyConfig: null as unknown,
}));

vi.mock('@/config', () => ({
	BACKEND_URL: 'https://backend.test',
	OHTTP_RELAY: 'https://relay.test',
}));

vi.mock('@/context/SessionContext', () => ({
	useSessionContext: () => ({ obliviousKeyConfig: mocks.obliviousKeyConfig }),
}));

vi.mock('@/lib/utils/ohttpHelpers', () => ({
	encryptedHttpRequest: mocks.encryptedHttpRequest,
	toArrayBuffer: (u8: Uint8Array) => u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength),
}));

vi.mock('@/indexedDB', () => ({
	addItem: vi.fn(),
	getItem: vi.fn(),
}));

const encode = (text: string) => new TextEncoder().encode(text);

const ohttpResponse = (status: number, contentType: string, body: string) => ({
	status,
	headers: { 'content-type': contentType },
	body: encode(body),
});

const renderProxy = () => renderHook(() => useHttpProxy()).result.current;

beforeEach(() => {
	vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
	vi.restoreAllMocks();
	mocks.encryptedHttpRequest.mockReset();
	mocks.obliviousKeyConfig = null;
	sessionStorage.clear();
});

describe('useHttpProxy().post over OHTTP', () => {
	beforeEach(() => {
		mocks.obliviousKeyConfig = { keyId: 1 };
	});

	it('returns the decoded JSON body on success', async () => {
		mocks.encryptedHttpRequest.mockResolvedValue(
			ohttpResponse(200, 'application/json', JSON.stringify({ access_token: 'at' })),
		);

		const res = await renderProxy().post('https://as.test/token', 'grant_type=x', {});

		expect(res.status).toBe(200);
		expect(res.data).toEqual({ access_token: 'at' });
	});

	it('returns the decoded JSON error body for a non-2xx response', async () => {
		mocks.encryptedHttpRequest.mockResolvedValue(
			ohttpResponse(
				400,
				'application/json',
				JSON.stringify({
					error: 'invalid_grant',
					error_description: 'pre-authorized code expired',
				}),
			),
		);

		const res = await renderProxy().post('https://as.test/token', 'grant_type=x', {});

		expect(res.status).toBe(400);
		expect(res.headers).toMatchObject({ 'content-type': 'application/json' });
		expect(res.data).toEqual({
			error: 'invalid_grant',
			error_description: 'pre-authorized code expired',
		});
	});

	it('returns the decoded JSON error body when the content type has parameters', async () => {
		mocks.encryptedHttpRequest.mockResolvedValue(
			ohttpResponse(400, 'application/json; charset=utf-8', JSON.stringify({ error: 'invalid_proof' })),
		);

		const res = await renderProxy().post('https://issuer.test/credential', {}, {});

		expect(res.status).toBe(400);
		expect(res.data).toEqual({ error: 'invalid_proof' });
	});

	it('returns the decoded text error body for a non-2xx response', async () => {
		mocks.encryptedHttpRequest.mockResolvedValue(ohttpResponse(503, 'text/plain', 'Service Unavailable'));

		const res = await renderProxy().post('https://issuer.test/credential', {}, {});

		expect(res.status).toBe(503);
		expect(res.data).toBe('Service Unavailable');
	});

	it('keeps the www-authenticate header of a non-2xx response', async () => {
		mocks.encryptedHttpRequest.mockResolvedValue({
			...ohttpResponse(401, 'application/json', JSON.stringify({ error: 'use_dpop_nonce' })),
			headers: {
				'content-type': 'application/json',
				'www-authenticate': 'DPoP error="use_dpop_nonce"',
				'dpop-nonce': 'n-1',
			},
		});

		const res = await renderProxy().post('https://issuer.test/credential', {}, {});

		expect(res.status).toBe(401);
		expect(res.headers).toMatchObject({
			'www-authenticate': 'DPoP error="use_dpop_nonce"',
			'dpop-nonce': 'n-1',
		});
	});
});

describe('useHttpProxy().post through the backend proxy', () => {
	beforeEach(() => {
		sessionStorage.setItem('appToken', JSON.stringify('app-token'));
	});

	it('returns the wrapped upstream response on success', async () => {
		const upstream = { status: 200, headers: { 'content-type': 'application/json' }, data: { access_token: 'at' } };
		const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: upstream });

		const res = await renderProxy().post('https://as.test/token', 'grant_type=x', {});

		expect(res).toEqual(upstream);
		expect(post).toHaveBeenCalledWith(
			'https://backend.test/proxy',
			expect.objectContaining({ url: 'https://as.test/token', method: 'POST' }),
			expect.objectContaining({ headers: { Authorization: 'Bearer app-token' } }),
		);
	});

	it('returns the wrapped upstream error response when the proxy responds with an error', async () => {
		const upstream = { status: 400, headers: { 'content-type': 'application/json' }, data: { error: 'invalid_grant' } };
		const config = { headers: new AxiosHeaders() };
		vi.spyOn(axios, 'post').mockRejectedValue(
			new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, {
				data: upstream,
				status: 400,
				statusText: 'Bad Request',
				headers: {},
				config,
			}),
		);

		const res = await renderProxy().post('https://as.test/token', 'grant_type=x', {});

		expect(res).toEqual(upstream);
	});
});
