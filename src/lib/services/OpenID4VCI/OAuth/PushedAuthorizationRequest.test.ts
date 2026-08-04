// @vitest-environment node

import * as jose from 'jose';
import { describe, expect, it, vi } from 'vitest';
import { bindPushedAuthorizationRequestToClientInstance } from './PushedAuthorizationRequest';

vi.mock('@/config', () => ({ MODE: 'test', BACKEND_URL: 'https://wallet.example' }));

describe('pushed authorization request DPoP binding', () => {
	it('sets dpop_jkt from the same client instance key returned for the issuance session', async () => {
		const params: Record<string, string> = { client_id: 'wallet-client' };
		const clientInstance = await bindPushedAuthorizationRequestToClientInstance(params);

		expect(params.dpop_jkt).toBe(await jose.calculateJwkThumbprint(clientInstance.publicJwk));
	});
});
