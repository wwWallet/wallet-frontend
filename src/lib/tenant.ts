/**
 * Tenant utilities for multi-tenancy support.
 *
 * Multi-tenancy Design:
 * - Login is global (tenant-discovering): The user selects a passkey, and the tenant
 *   is determined from the passkey's userHandle which encodes "tenantId:userId"
 * - Registration is tenant-scoped: When registering within a tenant context,
 *   the registration endpoint includes the tenant ID in the path
 * - After login, the backend returns the tenant_id which should be stored
 *   and used for subsequent API calls and routing
 *
 * See go-wallet-backend/docs/adr/011-multi-tenancy.md for full design.
 */

const TENANT_STORAGE_KEY = 'wallet_tenant_id';

/**
 * Get the stored tenant ID from sessionStorage.
 * Returns undefined if no tenant is stored (single-tenant or not yet logged in).
 */
export function getStoredTenant(): string | undefined {
	const tenant = sessionStorage.getItem(TENANT_STORAGE_KEY);
	return tenant || undefined;
}

/**
 * Store the current tenant ID in sessionStorage.
 * Called after successful login when the backend returns the tenant.
 */
export function setStoredTenant(tenantId: string): void {
	sessionStorage.setItem(TENANT_STORAGE_KEY, tenantId);
}

/**
 * Clear the stored tenant ID.
 * Called on logout.
 */
export function clearStoredTenant(): void {
	sessionStorage.removeItem(TENANT_STORAGE_KEY);
}

/**
 * Build a tenant-scoped API path.
 *
 * For WebAuthn registration within a tenant context, the endpoint becomes:
 *   /t/{tenantId}/user/register-webauthn-begin
 *   /t/{tenantId}/user/register-webauthn-finish
 *
 * @param tenantId - The tenant ID to scope to
 * @param basePath - The base path (e.g., '/user/register-webauthn-begin')
 * @returns The tenant-scoped path with /t/ prefix
 */
export function buildTenantApiPath(tenantId: string, basePath: string): string {
	const cleanPath = basePath.startsWith('/') ? basePath : `/${basePath}`;
	return `/t/${tenantId}${cleanPath}`;
}

/**
 * Check if multi-tenancy is active (a tenant is stored).
 */
export function isMultiTenantActive(): boolean {
	return !!getStoredTenant();
}
