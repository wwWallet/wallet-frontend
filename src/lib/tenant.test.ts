import { describe, it, expect } from 'vitest';
import {
	extractTenantFromUserHandle,
	isDefaultTenant,
	buildTenantApiPath,
	DEFAULT_TENANT_ID,
} from './tenant';

describe('tenant utilities', () => {
	describe('extractTenantFromUserHandle', () => {
		it('should extract tenant from userHandle with format "tenantId:userId"', () => {
			const userHandle = new TextEncoder().encode('acme-corp:550e8400-e29b-41d4-a716-446655440000');
			expect(extractTenantFromUserHandle(userHandle)).toBe('acme-corp');
		});

		it('should extract tenant from string userHandle', () => {
			expect(extractTenantFromUserHandle('acme-corp:550e8400-e29b-41d4-a716-446655440000')).toBe('acme-corp');
		});

		it('should extract "default" tenant from userHandle', () => {
			const userHandle = new TextEncoder().encode('default:550e8400-e29b-41d4-a716-446655440000');
			expect(extractTenantFromUserHandle(userHandle)).toBe('default');
		});

		it('should return undefined for legacy userHandle without tenant prefix', () => {
			// Legacy format: just the userId without tenant prefix
			const userHandle = new TextEncoder().encode('550e8400-e29b-41d4-a716-446655440000');
			expect(extractTenantFromUserHandle(userHandle)).toBeUndefined();
		});

		it('should return undefined for null/undefined userHandle', () => {
			expect(extractTenantFromUserHandle(null)).toBeUndefined();
			expect(extractTenantFromUserHandle(undefined)).toBeUndefined();
		});

		it('should return undefined for empty userHandle', () => {
			expect(extractTenantFromUserHandle('')).toBeUndefined();
			expect(extractTenantFromUserHandle(new Uint8Array())).toBeUndefined();
		});

		it('should handle ArrayBuffer input', () => {
			const str = 'acme-corp:user-id-123';
			const encoder = new TextEncoder();
			const arrayBuffer = encoder.encode(str).buffer;
			expect(extractTenantFromUserHandle(arrayBuffer)).toBe('acme-corp');
		});

		it('should handle userHandle with empty tenant (just colon)', () => {
			const userHandle = new TextEncoder().encode(':user-id');
			// Empty string before colon should return undefined
			expect(extractTenantFromUserHandle(userHandle)).toBeUndefined();
		});
	});

	// Note: buildLoginFinishPath and buildLoginBeginPath were removed.
	// Login now uses global endpoints only (/user/login-webauthn-begin, /user/login-webauthn-finish).
	// Backend discovers tenant from userHandle.

	describe('isDefaultTenant', () => {
		it('should return true for undefined', () => {
			expect(isDefaultTenant(undefined)).toBe(true);
		});

		it('should return true for empty string', () => {
			expect(isDefaultTenant('')).toBe(true);
		});

		it('should return true for "default"', () => {
			expect(isDefaultTenant(DEFAULT_TENANT_ID)).toBe(true);
			expect(isDefaultTenant('default')).toBe(true);
		});

		it('should return false for non-default tenant', () => {
			expect(isDefaultTenant('acme-corp')).toBe(false);
			expect(isDefaultTenant('my-tenant')).toBe(false);
		});
	});

	describe('buildTenantApiPath', () => {
		it('should build tenant-scoped API path with leading slash', () => {
			expect(buildTenantApiPath('acme', '/user/register')).toBe('/t/acme/user/register');
		});

		it('should build tenant-scoped API path without leading slash', () => {
			expect(buildTenantApiPath('acme', 'user/register')).toBe('/t/acme/user/register');
		});

		it('should work with various tenant IDs', () => {
			expect(buildTenantApiPath('org-123', '/user/login')).toBe('/t/org-123/user/login');
		});
	});
});
